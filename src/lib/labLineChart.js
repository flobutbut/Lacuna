/**
 * Utilitaire D3 partagé — courbes temps × amplitude pour les rapports Laboratoire
 * Utilisé par : LabReportGravimetrique (résidus), LabReportStructureTemporelle (forme d'onde, autocorrélation)
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md
 */
import * as d3 from 'd3'

const DEFAULT_MARGIN = { top: 8, right: 8, bottom: 24, left: 42 }
const AXIS_STYLE = { fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }

/**
 * Rend une courbe D3 dans un SVG existant.
 * @param {SVGElement} svgEl - Élément SVG cible
 * @param {Object} opts
 * @param {Array<[number, number]>} opts.data - Données [[x, y], ...]
 * @param {number} opts.width - Largeur SVG
 * @param {number} [opts.height=140] - Hauteur SVG
 * @param {Object} [opts.margin] - Marges
 * @param {[number, number]} [opts.xDomain] - Domaine X (auto si omis)
 * @param {[number, number]} [opts.yDomain] - Domaine Y (auto si omis)
 * @param {Function} [opts.xAccessor] - d => x (défaut: d => d[0])
 * @param {Function} [opts.yAccessor] - d => y (défaut: d => d[1])
 * @param {string} [opts.strokeColor='var(--color-cyan)']
 * @param {boolean} [opts.showZeroLine=false] - Ligne en pointillés à y=0
 * @param {Function} [opts.xTickFormat] - Formateur axe X
 * @param {number} [opts.yPaddingPercent=0.1] - Padding domaine Y (ratio)
 * @param {string} [opts.xAxisLabel] - Label axe X (ex. "t (s)")
 * @param {string} [opts.yAxisLabel] - Label axe Y (ex. "amplitude")
 */
export function renderLineChart(svgEl, opts = {}) {
  const {
    data,
    width,
    height = 140,
    margin = DEFAULT_MARGIN,
    xDomain,
    yDomain,
    xAccessor = (d) => d[0],
    yAccessor = (d) => d[1],
    strokeColor = 'var(--color-cyan)',
    showZeroLine = false,
    xTickFormat,
    yPaddingPercent = 0.1,
    xAxisLabel,
    yAxisLabel,
  } = opts

  if (!svgEl || !data?.length) return

  const innerWidth = width - margin.left - margin.right

  const xMin = xDomain?.[0] ?? Math.min(...data.map(xAccessor))
  const xMax = xDomain?.[1] ?? Math.max(...data.map(xAccessor))
  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([margin.left, width - margin.right])

  const yValues = data.map(yAccessor)
  const yMin = yDomain?.[0] ?? Math.min(...yValues)
  const yMax = yDomain?.[1] ?? Math.max(...yValues)
  const yPad =
    yDomain != null ? 0 : Math.max((yMax - yMin) * yPaddingPercent || Math.abs(yMin || yMax || 1) * 0.1, 1e-6)
  const yScale = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([height - margin.bottom, margin.top])

  const line = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))
    .defined((d) => {
      const x = xAccessor(d)
      const y = yAccessor(d)
      return x >= xMin && x <= xMax && Number.isFinite(y)
    })

  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', height)

  svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', strokeColor)
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.9)
    .attr('d', line)

  if (showZeroLine && yMin <= 0 && yMax >= 0) {
    svg
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'var(--color-muted)')
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-opacity', 0.5)
  }

  const axisBottom = d3.axisBottom(xScale).ticks(5).tickSize(4)
  if (xTickFormat) axisBottom.tickFormat(xTickFormat)

  const gX = svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(axisBottom)
    .style('font-size', AXIS_STYLE.fontSize)
    .attr('color', AXIS_STYLE.color)

  if (xAxisLabel) {
    gX
      .append('text')
      .attr('x', width - margin.right)
      .attr('y', 18)
      .attr('text-anchor', 'end')
      .style('font-size', 'var(--text-2xs)')
      .style('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-muted)')
      .text(xAxisLabel)
  }

  const gY = svg.append('g').attr('transform', `translate(${margin.left},0)`)
  gY
    .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickSizeOuter(0))
    .style('font-size', AXIS_STYLE.fontSize)
    .attr('color', AXIS_STYLE.color)
  gY.selectAll('.tick').filter((_, i, n) => i === n.length - 1).select('line').attr('stroke', 'none')

  if (yAxisLabel) {
    gY
      .append('text')
      .attr('x', -8)
      .attr('y', margin.top)
      .attr('text-anchor', 'end')
      .style('font-size', 'var(--text-2xs)')
      .style('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-muted)')
      .text(yAxisLabel)
  }
}
