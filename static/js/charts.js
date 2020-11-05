const makeConfig = formattedData => {
  return {
    type: 'line',
    data: {
      labels: formattedData.labels,
      datasets: [{
        label: 'Participants en ligne',
        backgroundColor: '#b60000',
        borderColor: '#b60000',
        data: formattedData.onlineParticipantsSeries,
        fill: false,
      }, {
        label: 'Nombre de conférences actives',
        fill: false,
        backgroundColor: '#000091',
        borderColor: '#000091',
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
          ticks: {
            autoSkip: true,
            maxTicksLimit: 20,
          },
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
          },
          ticks: {
            fixedStepSize: 1,
            beginAtZero: true,
          },
        }]
      },
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

window.onload = function() {
  let data = []
  try {
    data = fetchData()
  } catch (err) {
    console.error('Could get data.', JSONdata, err)
    return
  }

  const ctx = document.getElementById('myChart').getContext('2d')
  window.myLine = new Chart(ctx, makeConfig(data))
};
