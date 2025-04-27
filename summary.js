document.addEventListener('DOMContentLoaded', () => {
    // get the references
    const form = document.getElementById('chart-filter-form');
    const downloadBtn = document.getElementById('download-pdf-btn');
    const totalEl = document.getElementById('summary-total');
    const titleEl = document.querySelector('#chart-area .card-title');
    const ctx = document.getElementById('summary-chart').getContext('2d');
  
    // ititialize the bar chart
    const chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Total Spend', data: [], backgroundColor: [] }] },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y.toFixed(2)}` } }
        }
      }
    });
  
    // function to get the expenses data
    function getExpenses() {
      // return the expenses or null if none have been added
      return JSON.parse(localStorage.getItem('expenses')) || [];
    }
  
    // use the specified date range
    function filterByRange(expenses, { timeframe, customStart, customEnd }) {
      const now = new Date();
      let start, end;
  
      if (timeframe === 'week') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        end = now;
      } else if (timeframe === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
      } else if (timeframe === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
      } else {
        // custom time input
        if (customStart) {
        start = new Date(customStart);
        } else {
        start = new Date(0);
        }

        if (customEnd) {
        end = new Date(customEnd);
        } else {
        end = now;
        }
      }
  
      return expenses.filter(exp => {
        const d = new Date(exp.date);
        return d >= start && d <= end;
      });
    }
  
    // group the data by categories
    function aggregateByCategory(expenses) {
      return expenses.reduce((agg, exp) => {
        agg[exp.category] = (agg[exp.category] || 0) + parseFloat(exp.amount);
        return agg;
      }, {});
    }
  
    // display the date range on chart
    function formatDateRange(timeframe, customStart, customEnd) {
      const now = new Date();
      let start, end;
  
      if (timeframe === 'week') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        end = now;
      } else if (timeframe === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
      } else if (timeframe === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
      } else {
        if (customStart) {
        start = new Date(customStart);
        } else {
        start = new Date(0);
        }

        if (customEnd) {
        end = new Date(customEnd);
        } else {
        end = now;
        }
      }
  
      const opts = { year: 'numeric', month: 'short', day: 'numeric' };
      return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
    }
  
    // render the chart
    function renderChart() {
      const formData = new FormData(form);
      const timeframe = formData.get('filter-timeframe');
      const customStart = formData.get('start-date');
      const customEnd = formData.get('end-date');
  
      // filter the data
      const raw = getExpenses();
      const filtered = filterByRange(raw, { timeframe, customStart, customEnd });
  
      // group the data
      const byCat = aggregateByCategory(filtered);
      const labels = Object.keys(byCat);
      const data = labels.map(cat => byCat[cat]);
  
      // input the data
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = labels.map(_ =>
        // use a random color generator algorithm
        `rgba(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},0.6)`
      );
      chart.update();
  
      // total the data
      const total = data.reduce((sum, v) => sum + v, 0);
      totalEl.textContent = `Total: $${total.toFixed(2)}`;
  
      // add in the date range for the chart
      const rangeStr = formatDateRange(timeframe, customStart, customEnd);
      titleEl.textContent = `Spending Summary (${rangeStr})`;
      
      return rangeStr;
    }
  
    // export the PDF file
    downloadBtn.addEventListener('click', () => {
      // first rerender to ensure the title is up to date
      const rangeStr = renderChart();
  
      // get the card element
      const card = document.querySelector('#chart-area .card');
  
      // use the html2canvas function to get a picture
      html2canvas(card).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        // create PDF in landscape format
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape' });
  
        // fit image to page width and keep the aspect ratio
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        // replace spaces and slashes
        const safeRange = rangeStr.replace(/[^A-Za-z0-9\-]/g, '_');
        pdf.save(`Spending_Summary_${safeRange}.pdf`);
      });
    });
  
    // render the chart and prevent a default page reload
    form.addEventListener('submit', e => {
      e.preventDefault();
      renderChart();
    });
  
    renderChart();
  });