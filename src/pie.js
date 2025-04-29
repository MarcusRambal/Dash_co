/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async () => {
  async function loadHeatData () {
    try {
      const response = await fetch('../public/data/dataYear.json')
      if (!response.ok) throw new Error('Network response was not ok')
      return await response.json()
    } catch (error) {
      console.error('Error al cargar los datos de calor:', error)
      return {}
    }
  }

  const dataYear = await loadHeatData()
  const yearSelector = document.getElementById('pieYearSelector')

  Object.keys(dataYear).forEach(year => {
    const option = document.createElement('option')
    option.value = year
    option.textContent = year
    yearSelector.appendChild(option)
  })

  const initialyear = Object.keys(dataYear)[0]
  renderpieChart(dataYear[initialyear])

  yearSelector.addEventListener('change', e => {
    const selectedyear = e.target.value
    renderpieChart(dataYear[selectedyear])
  })
})

function renderpieChart (dataForyear) {
  const svg = d3.select('#pieChart')
  svg.selectAll('*').remove()

  const width = 500
  const height = 500
  const radius = Math.min(width, height) / 2

  svg.attr('width', width).attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const color = d3.scaleOrdinal()
    .range([
      '#ff69b4', '#d8bfd8', '#c71585', '#db7093', '#f08080',
      '#808080', '#a9a9a9', '#2f4f4f', '#000000', '#4b0082'
    ])

  const pie = d3.pie()
    .sort(null)
    .value(d => d.deaths)

  const data = Object.entries(dataForyear)
    .map(([country, deaths]) => ({ country, deaths }))
    .filter(d => d.deaths > 0)
    .sort((a, b) => b.deaths - a.deaths)
    .slice(0, 10)

  const arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0)

  const arcOver = d3.arc()
    .outerRadius(radius - 5)
    .innerRadius(0)

  const arcs = g.selectAll('.arc')
    .data(pie(data))
    .enter().append('g')
    .attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.country))
    .attr('stroke', '#fff')
    .attr('stroke-width', '2px')
    .on('mouseover', function (event, d) {
      d3.select(this).transition().duration(200).attr('d', arcOver)
    })
    .on('mouseout', function (event, d) {
      d3.select(this).transition().duration(200).attr('d', arc)
    })
  arcs.append('title')
    .text(d => `${d.data.country}: ${d.data.deaths.toLocaleString()} muertes`)

  arcs.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('dy', '0.35em')
    .style('font-size', '10px')
    .style('fill', '#f0f0f0')
    .style('text-anchor', 'middle')
    .text(d => {
      const name = d.data.country
      return name.length > 12 ? name.slice(0, 10) + '…' : name
    })
}
