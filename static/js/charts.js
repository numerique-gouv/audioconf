/**
 *  Datasets is an array, like this:
 *  [{
      label: 'Participants en ligne',
      color: 'red',
      data: data.onlineParticipantsSeries,
    }]
 */
const makeConfig = (chartName, xAxisLabels, datasets) => {
  const config =  {
    type: 'line',
    data: {
      labels: xAxisLabels,
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: chartName,
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
  config.data.datasets = datasets.map(dataset => {
    return {
      label: dataset.label,
      fill: false,
      backgroundColor: dataset.color,
      borderColor: dataset.color,
      data: dataset.data,
      radius: '2',
    }
  })
  return config
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

const drawChart = (chartElId, config) => {
  const ctx = document.getElementById(chartElId).getContext('2d')
  window.myLine = new Chart(ctx, config)
}

window.onload = function() {
  let data = []
  try {
    data = fetchData()
  } catch (err) {
    console.error('Could get data.', JSONdata, err)
    return
  }

  Chart.defaults.global.defaultFontFamily = '"Marianne", arial, sans-serif'
  Chart.defaults.global.defaultFontSize = 16

  const datasets = [
    {
      label: 'Participants en ligne',
      color: '#b60000',
      data: data.onlineParticipantsSeries,
    },
    {
      label: 'Conférences actives',
      color: '#000091',
      data: data.activeConfsSeries,
    },
  ]
  const config = makeConfig('Statistiques d\'utilisation', data.labels, datasets)
  drawChart('conf-stats-chart', config)

  if (data.USE_OVH_ROOM_API) {
    const datasets2 = [
      {
        label: 'Salles de conférence réservées',
        color: 'cyan',
        data: data.bookedRoomsSeries,
      },
      {
        label: 'Salles de conférence actives',
        color: '#000091',
        data: data.activeConfsSeries,
      },
    ]
    const config2 = makeConfig('Utilisation des salles de conférence', data.labels, datasets2)
    drawChart('conf-booking-chart', config2)
  } else {
    const datasets2 = [
      {
        label: 'Numéros de conférence réservés',
        color: 'cyan',
        data: data.bookedPhoneNumbersSeries,
      },
      {
        label: 'Numéros de conférence actifs',
        color: '#000091',
        data: data.activeConfsSeries,
      },
      {
        label: 'Tous les numéros de conférence',
        color: 'black',
        data: data.phoneNumbersSeries,
      },
    ]
    const config2 = makeConfig('Utilisation des numéros de conférence', data.labels, datasets2)
    drawChart('conf-booking-chart', config2)
  }
}
