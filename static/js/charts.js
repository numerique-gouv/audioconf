const makeConfig = formattedData => {
  return {
    type: 'line',
    data: {
      labels: formattedData.labels,
      datasets: [{
        label: 'Participants en ligne',
        backgroundColor: 'red',
        borderColor: 'red',
        data: formattedData.onlineParticipantsSeries,
        fill: false,
      }, {
        label: 'Nombre de conférences actives',
        fill: false,
        backgroundColor: 'blue',
        borderColor: 'blue',
        data: formattedData.activeConfsSeries,
      }]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Statistiques d\'utilisation',
      },
      tooltips: {
        mode: 'index',
        intersect: false,
      },
      hover: {
        mode: 'nearest',
        intersect: true,
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Temps',
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Nombre',
          }
        }]
      }
    }
  }
}

const fetchData = () => {
  const dataEl = document.getElementById('chart-data')
  if (!dataEl) {
    console.error('No data element found.')
    return
  }
  const JSONdata = dataEl.textContent
  console.log('got JSONdata', JSONdata)

  const data = JSON.parse(JSONdata)
  console.log('got data', data)
  return data
}

/**
 * inData = [{"date":"2020-11-05T14:11:00.440Z","onlineParticipantsCount":0,"activeConfsCount":0,"errorConfsCount":0}, {...}, ...]
 * outData = { labels: [dates], onlineParticipantsSeries: [series], activeConfsSeries: [series] }
 */
const formatDataForDisplay = inData => {
  const outData = { labels: [], onlineParticipantsSeries: [], activeConfsSeries: [] }
  inData.forEach(dataPoint => {
    // Use unshift to add at the beginning of array, because the inData is in reverse chronological order.
    outData.labels.unshift(dataPoint.date)
    outData.onlineParticipantsSeries.unshift(dataPoint.onlineParticipantsCount)
    outData.activeConfsSeries.unshift(dataPoint.activeConfsCount)
  })
  return outData
}

window.onload = function() {
  let data = []
  try {
    data = fetchData()
  } catch (err) {
    console.error('Could get data.', JSONdata, err)
    return
  }

  const formattedData = formatDataForDisplay(data)
  console.log('formattedData', formattedData)

  const ctx = document.getElementById('myChart').getContext('2d')
  window.myLine = new Chart(ctx, makeConfig(formattedData))
};
