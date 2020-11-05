const config = {
  type: 'line',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [{
      label: 'My First dataset',
      backgroundColor: 'red',
      borderColor: 'red',
      data: [
        0, 10, 5, 2, 20, 30, 45,
      ],
      fill: false,
    }, {
      label: 'My Second dataset',
      fill: false,
      backgroundColor: 'blue',
      borderColor: 'blue',
      data: [
        10, 5, 2, 20, 30, 45, 10,
      ],
    }]
  },
  options: {
    responsive: true,
    title: {
      display: true,
      text: 'Chart.js Line Chart',
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
          labelString: 'Month',
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Value',
        }
      }]
    }
  }
}

window.onload = function() {
  const ctx = document.getElementById('myChart').getContext('2d')
  window.myLine = new Chart(ctx, config)
};
