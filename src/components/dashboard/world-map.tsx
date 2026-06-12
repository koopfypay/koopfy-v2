"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Zap, Activity, Globe } from "lucide-react"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface CountryData {
  id: string
  name: string
  code: string
  coordinates: [number, number]
  volume: string
  volumeNum: number
  transactions: string
  growth: string
  isActive: boolean
  region: string
  countryCode: string
}

const countries: CountryData[] = [
  { id: "us", name: "Estados Unidos", code: "EUA", countryCode: "USA", coordinates: [-95.7, 37.0], volume: "$1.2M", volumeNum: 1200000, transactions: "+24.8k", growth: "+18.5%", isActive: true, region: "Américas" },
  { id: "pt", name: "Portugal", code: "PT", countryCode: "PRT", coordinates: [-8.2, 39.4], volume: "$920K", volumeNum: 920000, transactions: "8.2K", growth: "+9.8%", isActive: true, region: "Europa" },
  { id: "mx", name: "México", code: "MX", countryCode: "MEX", coordinates: [-102.5, 23.6], volume: "$290K", volumeNum: 290000, transactions: "5.4K", growth: "+8.1%", isActive: true, region: "Américas" },
  { id: "ar", name: "Argentina", code: "AR", countryCode: "ARG", coordinates: [-63.6, -38.4], volume: "$210K", volumeNum: 210000, transactions: "4.2K", growth: "+15.3%", isActive: true, region: "Américas" },
  { id: "uk", name: "Reino Unido", code: "UK", countryCode: "GBR", coordinates: [-3.4, 55.4], volume: "$880K", volumeNum: 880000, transactions: "15.1K", growth: "+14.5%", isActive: true, region: "Europa" },
  { id: "de", name: "Alemanha", code: "DE", countryCode: "DEU", coordinates: [10.4, 51.2], volume: "$540K", volumeNum: 540000, transactions: "11.3K", growth: "+8.7%", isActive: true, region: "Europa" },
  { id: "fr", name: "França", code: "FR", countryCode: "FRA", coordinates: [2.2, 46.2], volume: "$780K", volumeNum: 780000, transactions: "9.8K", growth: "+11.2%", isActive: true, region: "Europa" },
  { id: "ng", name: "Nigéria", code: "NG", countryCode: "NGA", coordinates: [8.7, 9.1], volume: "$95K", volumeNum: 95000, transactions: "+3.1k", growth: "+45.2%", isActive: true, region: "África" },
  { id: "za", name: "África do Sul", code: "ZA", countryCode: "ZAF", coordinates: [22.9, -30.6], volume: "$120K", volumeNum: 120000, transactions: "+2.9k", growth: "+32.1%", isActive: true, region: "África" },
  { id: "ae", name: "Emirados Árabes", code: "AE", countryCode: "ARE", coordinates: [53.8, 23.4], volume: "$310K", volumeNum: 310000, transactions: "4.5K", growth: "+25.8%", isActive: true, region: "Oriente Médio" },
  { id: "in", name: "Espanha", code: "ES", countryCode: "ESP", coordinates: [78.9, 20.6], volume: "$750K", volumeNum: 750000, transactions: "+8.5k", growth: "+38.5%", isActive: true, region: "Ásia" },
  { id: "sg", name: "Singapura", code: "SG", countryCode: "SGP", coordinates: [103.8, 1.4], volume: "$580K", volumeNum: 580000, transactions: "+17.3k", growth: "+19.2%", isActive: true, region: "Ásia" },
  { id: "jp", name: "Japão", code: "JP", countryCode: "JPN", coordinates: [138.3, 36.2], volume: "$220K", volumeNum: 720000, transactions: "9.8K", growth: "+12.4%", isActive: true, region: "Ásia" },
  { id: "au", name: "Austrália", code: "AU", countryCode: "AUS", coordinates: [133.8, -25.3], volume: "$320K", volumeNum: 320000, transactions: "5.1K", growth: "+16.8%", isActive: true, region: "Oceania" },
]

interface Connection {
  from: string
  to: string
  volume: number
}

const connections: Connection[] = [
  { from: "br", to: "us", volume: 850000 },
  { from: "br", to: "pt", volume: 420000 },
  { from: "br", to: "uk", volume: 380000 },
  { from: "us", to: "uk", volume: 680000 },
  { from: "us", to: "jp", volume: 720000 },
  { from: "uk", to: "sg", volume: 450000 },
  { from: "uk", to: "de", volume: 540000 },
  { from: "sg", to: "au", volume: 320000 },
  { from: "ae", to: "in", volume: 310000 },
  { from: "de", to: "ae", volume: 290000 },
  { from: "ng", to: "za", volume: 95000 },
  { from: "in", to: "sg", volume: 450000 },
  { from: "jp", to: "cn", volume: 720000 },
  { from: "cn", to: "sg", volume: 580000 },
  { from: "fr", to: "br", volume: 380000 },
  { from: "us", to: "mx", volume: 290000 },
]

function getCountryCoordinates(id: string): [number, number] | null {
  const country = countries.find(c => c.id === id)
  return country ? country.coordinates : null
}

export function WorldMap() {
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null)
  const [activeConnections, setActiveConnections] = useState<Set<number>>(new Set([0, 2, 5, 8]))
  const [liveTransactions, setLiveTransactions] = useState(1892)
  const [pulsePhase, setPulsePhase] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const connectionInterval = setInterval(() => {
      setActiveConnections(prev => {
        const newSet = new Set<number>()
        const numActive = 3 + Math.floor(Math.random() * 4)
        while (newSet.size < numActive) {
          newSet.add(Math.floor(Math.random() * connections.length))
        }
        return newSet
      })
      setPulsePhase(p => p + 1)
    }, 2500)

    const txInterval = setInterval(() => {
      setLiveTransactions(prev => prev + Math.floor(Math.random() * 50) + 10)
    }, 1500)

    return () => {
      clearInterval(connectionInterval)
      clearInterval(txInterval)
    }
  }, [])

  const totalVolume = useMemo(() =>
    countries.reduce((sum, c) => sum + c.volumeNum, 0),
    [])

  const topCountries = useMemo(() =>
    [...countries].sort((a, b) => b.volumeNum - a.volumeNum).slice(0, 5),
    [])

  const handleMarkerHover = useCallback((country: CountryData, event: React.MouseEvent) => {
    setHoveredCountry(country)
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }, [])

  const handleMarkerLeave = useCallback(() => {
    setHoveredCountry(null)
    setTooltipPosition(null)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#070310]">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(139,92,246,0.08),transparent)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Map Container */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 130,
          center: [10, 20],
        }}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={[10, 20]} zoom={1}>
          {/* World Geography */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo: any) => {
                const isHighlighted = countries.some(c => c.countryCode === geo.properties.ISO_A3)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHighlighted ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.05)"}
                    stroke="rgba(139, 92, 246, 0.2)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: isHighlighted ? "rgba(139, 92, 246, 0.25)" : "rgba(139, 92, 246, 0.1)",
                        outline: "none",
                        transition: "all 0.3s ease",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {/* Connection Lines */}
          {connections.map((conn, i) => {
            const from = getCountryCoordinates(conn.from)
            const to = getCountryCoordinates(conn.to)
            if (!from || !to) return null

            const isActive = activeConnections.has(i)

            return (
              <g key={`conn-${i}`}>
                {/* Base line */}
                <Line
                  from={from}
                  to={to}
                  stroke="rgba(139, 92, 246, 0.15)"
                  strokeWidth={0.5}
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                />

                {/* Active line */}
                {isActive && (
                  <Line
                    from={from}
                    to={to}
                    stroke="rgba(167, 139, 250, 0.6)"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                )}
              </g>
            )
          })}

          {/* Country Markers */}
          {countries.map((country) => {
            const isHovered = hoveredCountry?.id === country.id
            const baseSize = country.volumeNum > 500000 ? 8 : country.volumeNum > 200000 ? 6 : 4
            const markerSize = isHovered ? baseSize * 1.4 : baseSize

            return (
              <Marker
                key={country.id}
                coordinates={country.coordinates}
                onMouseEnter={(e: any) => handleMarkerHover(country, e)}
                onMouseLeave={handleMarkerLeave}
              >
                {/* Outer pulse ring */}
                <circle
                  r={markerSize * 3}
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.3)"
                  strokeWidth={0.5}
                  className="animate-ping"
                  style={{ animationDuration: "3s" }}
                />

                {/* Glow background */}
                <circle
                  r={markerSize * 2}
                  fill="rgba(139, 92, 246, 0.15)"
                  className="transition-all duration-300"
                  style={{ filter: "blur(4px)" }}
                />

                {/* Main marker */}
                <circle
                  r={markerSize}
                  fill="url(#markerGradient)"
                  stroke="rgba(167, 139, 250, 0.8)"
                  strokeWidth={1}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    filter: isHovered ? "drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))" : "drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))",
                  }}
                />

                {/* Inner highlight */}
                <circle
                  r={markerSize * 0.4}
                  fill="rgba(255, 255, 255, 0.7)"
                  cx={-markerSize * 0.2}
                  cy={-markerSize * 0.2}
                />

                {/* Country label */}
                <text
                  textAnchor="middle"
                  y={-markerSize - 6}
                  className="fill-violet-400 text-[8px] font-bold tracking-wider"
                  style={{
                    opacity: isHovered ? 1 : 0.8,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  {country.code}
                </text>

                {/* Transaction count */}
                <text
                  textAnchor="middle"
                  y={markerSize + 10}
                  className="fill-violet-300/70 text-[6px] font-semibold"
                  style={{
                    opacity: isHovered ? 1 : 0.6,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  {country.transactions}
                </text>
              </Marker>
            )
          })}

          {/* Gradient definition */}
          <defs>
            <radialGradient id="markerGradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#7c3aed" />
            </radialGradient>
          </defs>
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover Tooltip */}
      {hoveredCountry && tooltipPosition && (
        <div
          className="pointer-events-none fixed z-50 animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: tooltipPosition.x + 16,
            top: tooltipPosition.y - 100,
          }}
        >
          <div className="relative rounded-2xl border border-violet-500/40 bg-[#0c0a18]/98 px-5 py-4 shadow-2xl shadow-violet-500/20 backdrop-blur-xl">
            {/* Glow effect */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/20 via-transparent to-violet-500/20 opacity-50" />

            {/* Corner decorations */}
            <div className="absolute -left-px -top-px size-5 rounded-tl-2xl border-l-2 border-t-2 border-violet-500" />
            <div className="absolute -right-px -top-px size-5 rounded-tr-2xl border-r-2 border-t-2 border-violet-500" />
            <div className="absolute -bottom-px -left-px size-5 rounded-bl-2xl border-b-2 border-l-2 border-violet-500" />
            <div className="absolute -bottom-px -right-px size-5 rounded-br-2xl border-b-2 border-r-2 border-violet-500" />

            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 shadow-lg shadow-violet-500/20 ring-1 ring-violet-500/40">
                  <span className="text-sm font-bold text-violet-400">{hoveredCountry.code}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-white">{hoveredCountry.name}</p>
                  <p className="text-xs font-medium text-violet-400/80">{hoveredCountry.region}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-5 border-t border-violet-500/20 pt-4">
                <div>
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">Volume</p>
                  <p className="text-base font-bold text-white">{hoveredCountry.volume}</p>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">Transações</p>
                  <p className="text-base font-bold text-white">{hoveredCountry.transactions}</p>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">Crescimento</p>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="size-4 text-violet-400" />
                    <p className="text-base font-bold text-violet-400">{hoveredCountry.growth}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Regions Panel */}
      <div className="absolute right-4 top-4 w-56">
        <div className="rounded-2xl border border-violet-500/20 bg-[#0c0a18]/95 p-4 shadow-xl shadow-violet-500/10 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-violet-400" />
              <span className="text-sm font-bold text-white">Top Regiões</span>
            </div>
            <Badge variant="outline" className="h-5 border-violet-500/30 bg-violet-500/10 px-2 text-[9px] font-semibold text-violet-400">
              <span className="relative mr-1.5 flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-violet-400" />
              </span>
              LIVE
            </Badge>
          </div>

          <div className="space-y-2">
            {topCountries.map((country, index) => (
              <div
                key={country.id}
                className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 ${hoveredCountry?.id === country.id
                  ? 'scale-[1.02] border-violet-500/50 bg-violet-500/15 shadow-lg shadow-violet-500/20'
                  : 'border-violet-500/10 bg-violet-500/5 hover:border-violet-500/30 hover:bg-violet-500/10'
                  }`}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {/* Rank */}
                <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${index === 0
                  ? 'bg-gradient-to-br from-violet-500 to-violet-500/70 text-white shadow-md shadow-violet-500/30'
                  : 'bg-violet-500/15 text-violet-400'
                  }`}>
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{country.name}</p>
                  <p className="text-[10px] font-medium text-gray-400">{country.volume}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="flex items-center gap-0.5 text-[10px] font-bold text-violet-400">
                    <TrendingUp className="size-2.5" />
                    {country.growth}
                  </p>
                </div>

                {/* Active indicator bar */}
                {hoveredCountry?.id === country.id && (
                  <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-violet-500/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
        {/* Legend */}
        <div className="flex items-center gap-6 rounded-2xl border border-violet-500/20 bg-[#0c0a18]/95 px-5 py-3 shadow-xl shadow-violet-500/10 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-gradient-to-br from-violet-400 to-violet-500/70 shadow-md shadow-violet-400/40" />
            </span>
            <span className="text-xs font-medium text-gray-400">Transações ativas</span>
          </div>
          <div className="h-5 w-px bg-violet-500/20" />
          <div className="flex items-center gap-2.5">
            <span className="size-3 rounded-full border-2 border-violet-500/40 bg-violet-500/15" />
            <span className="text-xs font-medium text-gray-400">Cobertura disponível</span>
          </div>
        </div>

        {/* Live metrics */}
        <div className="flex items-center gap-5 rounded-2xl border border-violet-500/20 bg-[#0c0a18]/95 px-5 py-3 shadow-xl shadow-violet-500/10 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
              <Activity className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Tx/min</p>
              <p className="text-sm font-bold tabular-nums text-white">{liveTransactions.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-violet-500/20" />
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
              <Zap className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Volume total</p>
              <p className="text-sm font-bold tabular-nums text-violet-400">${(totalVolume / 1000000).toFixed(2)}M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Badge */}
      <div className="absolute left-4 top-4">
        <Badge className="gap-2 border border-violet-500/40 bg-violet-500/20 px-3.5 py-2 text-[10px] font-bold text-violet-400 shadow-lg shadow-violet-500/20 backdrop-blur-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-violet-400 shadow-sm shadow-violet-400" />
          </span>
          AO VIVO
        </Badge>
      </div>
    </div>
  )
}
