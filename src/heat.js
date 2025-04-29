/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async () => {
  const dataYear = await loadHeatData()
  const CountryReference = await d3.json('./../public/data/standardCountries.json')
  await standardNames(CountryReference, dataYear)
  console.log(CountryReference)
  const yearSelector = document.getElementById('yearSelector')
  const width = 1200
  const height = 600
  let dynamicColorScale
  let legendSvg

  const svg = d3.select('#HeatChart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  svg.append('rect')
    .attr('x', 5)
    .attr('y', 7)
    .attr('width', width - 10)
    .attr('height', height - 10)
    .attr('rx', 15)
    .attr('ry', 15)
    .attr('fill', 'none')
    .attr('stroke', '#666')
    .attr('stroke-width', 2)
    .style('filter', 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))')
    .lower()

  const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.4])
  const path = d3.geoPath(projection)

  const g = svg.append('g')

  const countriesData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  const countries = topojson.feature(countriesData, countriesData.objects.countries)
  console.log(countries)
  g.selectAll('path').data(countries.features).enter().append('path')
    .attr('class', 'country')
    .attr('d', path)

  async function loadHeatData () {
    try {
      const response = await fetch('http://127.0.0.1:3000/dataYear')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const dataYear = await response.json()
      return dataYear
    } catch (error) {
      console.error('Error al cargar los datos de calor:', error)
    }
  }

  const AkaMap = {}

  AkaMap['united states of america'] = 'United States'
  AkaMap['russian federation'] = 'Russia'
  AkaMap["côte d'ivoire"] = 'Ivory Coast'
  AkaMap['democratic republic of the congo'] = 'Congo (Kinshasa)'
  AkaMap.congo = 'Congo (Brazzaville)'
  AkaMap['venezuela (bolivarian republic of)'] = 'Venezuela'
  AkaMap['korea, republic of'] = 'South Korea'
  AkaMap["korea, democratic people's republic of"] = 'North Korea'

  function normalizeName (str) {
    return str.trim().toLowerCase()
  }

  async function standardNames (CountryRef, Data) {
    const nameData = Object.keys(Data).map(normalizeName)

    CountryRef.forEach(p => {
      const nameRef = p.nameEN.trim()
      const nameNorm = normalizeName(nameRef)

      if (nameData.includes(nameNorm)) {
        AkaMap[nameNorm] = nameRef
      }
    })
  }

  if (!dataYear) return

  Object.keys(dataYear).forEach(year => {
    const option = document.createElement('option')
    option.value = year
    option.textContent = year
    yearSelector.appendChild(option)
  })

  function updateMapByYear (dataForYear) {
    console.log(dataForYear)
    const maxDeaths = d3.max(Object.values(dataForYear))
    dynamicColorScale = d3.scaleSequential(d3.interpolateReds).domain([0, maxDeaths])
    const getDeaths = d => {
      const rawName = d.properties.name
      const key = AkaMap[normalizeName(rawName)] || rawName
      return dataForYear[key] || 0
    }

    g.selectAll('path')
      .transition()
      .duration(500)
      .attr('fill', d => dynamicColorScale(getDeaths(d)))

    g.selectAll('path')
      .on('mouseover', function (event, d) {
        const rawName = d.properties.name
        const key = AkaMap[normalizeName(rawName)] || rawName
        const deaths = dataForYear[key] || 0
        d3.select('#tooltip')
          .style('display', 'block')
          .html(`<strong>${rawName}</strong><br>Muertes: ${deaths.toLocaleString()}`)
      })
      .on('mousemove', function (event) {
        d3.select('#tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px')
      })
      .on('mouseout', function () {
        d3.select('#tooltip').style('display', 'none')
      })
    updateColorLegend(maxDeaths)
  }

  function updateColorLegend (maxValue) {
    const legendWidth = 50
    const legendHeight = 300

    if (legendSvg) legendSvg.remove()

    legendSvg = d3.select('#HeatChart')
      .append('svg')
      .attr('width', 100)
      .attr('height', legendHeight + 40)
      .attr('style', 'margin-top: 20px')

    const defs = legendSvg.append('defs')
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%')

    linearGradient.selectAll('stop')
      .data([
        { offset: '0%', color: dynamicColorScale(0) },
        { offset: '100%', color: dynamicColorScale(maxValue) }
      ])
      .enter()
      .append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)

    legendSvg.append('rect')
      .attr('x', 40)
      .attr('y', 10)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#linear-gradient)')
      .style('stroke', '#000')
      .style('stroke-width', 0.5)

    const legendScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([legendHeight + 10, 10])

    const legendAxis = d3.axisLeft(legendScale).ticks(5)

    legendSvg.append('g')
      .attr('transform', 'translate(40, 0)')
      .call(legendAxis)
  }

  yearSelector.addEventListener('change', e => {
    const selectedYear = e.target.value
    updateMapByYear(dataYear[selectedYear])
  })

  const initialYear = Object.keys(dataYear)[0]
  yearSelector.value = initialYear
  updateMapByYear(dataYear[initialYear])
})
