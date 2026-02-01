
import React, { useEffect, useRef } from 'react';
import { 
  select, 
  zoom, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  drag
} from 'd3';
import { Transaction, SuspicionLedger } from '../types';

interface Props {
  transactions: Transaction[];
  ledger: SuspicionLedger;
  onSelectWallet: (id: string) => void;
  confidenceThreshold: number;
  regulatorMode: boolean;
}

const RAG_RED = "#f43f5e"; // Critical
const RAG_AMBER = "#fbbf24"; // Suspicious
const RAG_GREEN = "#10b981"; // Low Risk
const DARK_LINE = "#0f172a"; 

const GraphView: React.FC<Props> = ({ transactions, ledger, onSelectWallet, confidenceThreshold, regulatorMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<any>(null);

  useEffect(() => {
    if (!svgRef.current || transactions.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = select(svgRef.current);
    if (!simulationRef.current) svg.selectAll("*").remove();

    const mainContainer = (simulationRef.current ? svg.select("g") : svg.append("g")) as any;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        mainContainer.attr("transform", event.transform);
      });

    if (!simulationRef.current) svg.call(zoomBehavior as any);

    const uniqueWallets = Array.from(new Set(transactions.flatMap(tx => [tx.Source_Wallet_ID, tx.Dest_Wallet_ID])));
    const filteredNodesIds = uniqueWallets.filter(id => 
      (ledger[id]?.finalSuspicionScore || 0) > 0.05 || 
      ['wallet_bad_001', 'wallet_bad_002', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'].includes(id)
    );

    const nodes = filteredNodesIds.map(id => ({
      id,
      score: ledger[id]?.finalSuspicionScore || 0,
      tokenType: ledger[id]?.primaryTokenType || 'Bitcoin',
      isSeed: ['wallet_bad_001', 'wallet_bad_002', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'].includes(id),
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      fx: null as number | null,
      fy: null as number | null
    }));

    const links = transactions
      .filter(t => filteredNodesIds.includes(t.Source_Wallet_ID) && filteredNodesIds.includes(t.Dest_Wallet_ID))
      .map(tx => ({
        source: tx.Source_Wallet_ID,
        target: tx.Dest_Wallet_ID,
        amount: tx.Amount,
        tokenType: tx.Token_Type,
        id: `${tx.Source_Wallet_ID}-${tx.Dest_Wallet_ID}-${tx.txHash}`
      }));

    const simulation = forceSimulation<any>(nodes)
      .force("link", forceLink<any, any>(links).id(d => d.id).distance(180))
      // Pull suspected nodes closer (Agentic Force Clustering)
      .force("charge", forceManyBody<any>().strength(d => d.score > 0.4 ? -1800 : -900)) 
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide().radius(100))
      .alphaDecay(0.04);

    simulationRef.current = simulation;

    const defs = simulationRef.current ? svg.select("defs") : svg.append("defs");
    
    if (!simulationRef.current) {
      const createShadow = (id: string, color: string) => {
        const filter = defs.append("filter").attr("id", id).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
        filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 8).attr("result", "blur");
        filter.append("feFlood").attr("flood-color", color).attr("flood-opacity", 0.4).attr("result", "color");
        filter.append("feComposite").attr("in", "color").attr("in2", "blur").attr("operator", "in").attr("result", "shadow");
        const merge = filter.append("feMerge");
        merge.append("feMergeNode").attr("in", "shadow");
        merge.append("feMergeNode").attr("in", "SourceGraphic");
      };
      createShadow("node-shadow-red", RAG_RED);
      createShadow("node-shadow-amber", RAG_AMBER);
      createShadow("node-shadow-green", RAG_GREEN);

      defs.append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 38)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", DARK_LINE);
    }

    const linkGroup = mainContainer.selectAll(".link-group").data([0]).join("g").attr("class", "link-group");
    const nodeGroup = mainContainer.selectAll(".node-group-container").data([0]).join("g").attr("class", "node-group-container");

    const link = linkGroup.selectAll(".link-line")
      .data(links, (d: any) => d.id)
      .join("path")
      .attr("class", "link-line")
      .attr("stroke", DARK_LINE)
      .attr("stroke-opacity", 0.9)
      .attr("stroke-width", d => Math.max(2, Math.log10(d.amount + 1) * 3))
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)");

    const node = nodeGroup.selectAll(".node-element")
      .data(nodes, (d: any) => d.id)
      .join("g")
      .attr("class", "node-element cursor-pointer")
      .on("click", (e, d: any) => {
        onSelectWallet(d.id);
        highlightPaths(d.id);
        e.stopPropagation();
      })
      .call(drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.1).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }) as any);

    node.selectAll("circle").data(d => [d]).join("circle")
      .attr("r", d => d.isSeed ? 32 : 22 + (d.score * 25))
      .attr("fill", "white")
      .attr("stroke", d => {
        if (d.score > 0.7) return RAG_RED;
        if (d.score > 0.3) return RAG_AMBER;
        return RAG_GREEN;
      })
      .attr("stroke-width", d => d.isSeed ? 10 : 6)
      .attr("filter", (d: any) => {
        if (d.score > 0.7) return "url(#node-shadow-red)";
        if (d.score > 0.3) return "url(#node-shadow-amber)";
        return "url(#node-shadow-green)";
      });

    node.selectAll("text").data(d => [d]).join("text")
      .attr("dy", d => 60 + (d.score * 15))
      .attr("text-anchor", "middle")
      .attr("fill", "#0f172a")
      .attr("font-size", "11px")
      .attr("font-weight", "900")
      .attr("font-family", "JetBrains Mono")
      .text(d => regulatorMode ? `HIDDEN_${d.id.slice(-4)}` : d.id.slice(0, 8) + '..');

    simulation.on("tick", () => {
      link.attr("d", (d: any) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    const highlightPaths = (selectedId: string) => {
      node.transition().duration(250).style("opacity", 0.1);
      link.transition().duration(250).style("opacity", 0.05);

      const neighbors = new Set<string>([selectedId]);
      links.forEach(l => {
        const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
        if (s === selectedId || t === selectedId) {
          neighbors.add(s);
          neighbors.add(t);
        }
      });

      node.filter((d: any) => neighbors.has(d.id)).transition().duration(250).style("opacity", 1);
      link.filter((l: any) => {
        const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
        return s === selectedId || t === selectedId;
      }).transition().duration(250).style("opacity", 1).attr("stroke-width", 5).attr("stroke", d => d.score > 0.4 ? RAG_AMBER : RAG_GREEN);
    };

    svg.on("click", () => {
      onSelectWallet("");
      node.transition().duration(250).style("opacity", 1);
      link.transition().duration(250).style("opacity", 0.9).attr("stroke", DARK_LINE).attr("stroke-width", d => Math.max(2, Math.log10(d.amount + 1) * 3));
    });

    return () => { simulation.stop(); };
  }, [transactions, ledger, onSelectWallet, confidenceThreshold, regulatorMode]);

  return <svg ref={svgRef} className="w-full h-full block bg-transparent" />;
};

export default GraphView;
