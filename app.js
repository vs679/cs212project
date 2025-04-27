$(document).ready(function () {
  let filterMode = null;

  // ensure every expense in storage has an id
  function ensureExpenseIds(expenses) {
    let updated = false;
    expenses.forEach(exp => {
      if (!exp.id) {
        exp.id = Date.now() + Math.floor(Math.random() * 1000);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
    return expenses;
  }

  // load all expenses from localStorage (with IDs ensured)
  function loadExpenses() {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    return ensureExpenseIds(expenses);
  }

  // return the currently filtered list of expenses (used for CSV export too)
  function getFilteredExpenses() {
    const input = $('#search-title').val().trim().toLowerCase();
    const cat = $('#search-category').val();
    const sd = $('#start-date').val();
    const ed = $('#end-date').val();

    let ex = loadExpenses();

    // text / category / date filters
    ex = ex.filter(exp => {
      const titleMatch = !input || exp.title.toLowerCase().includes(input);
      const categoryMatch = !cat || exp.category === cat;
      const d = new Date(exp.date);
      const startMatch = !sd || d >= new Date(sd);
      const endMatch = !ed || d <= new Date(ed);
      return titleMatch && categoryMatch && startMatch && endMatch;
    });

    // edited / deleted toggles
    if (filterMode === 'edited') {
      ex = ex.filter(exp => exp.edited);
    } else if (filterMode === 'deleted') {
      ex = JSON.parse(localStorage.getItem('deletedExpenses')) || [];
    }
    return ex;
  }

  // append a card
  function appendExpenseCard(expense) {
    const card = $(`
      <div class="col-md-4 mb-3" data-id="${expense.id}">
        <div class="card expense-card" data-id="${expense.id}">
          <div class="card-body">
            <h5 class="card-title">${expense.title}</h5>
            <p class="card-text">
              Amount: $${parseFloat(expense.amount).toFixed(2)} |
              Date: ${expense.date} |
              Category: ${expense.category}
            </p>
            <a href="#" class="more-info text-decoration-underline">More Info</a>
            <div class="more-details mt-2" style="display:none;">
              <hr>
              <p class="description">${expense.description}</p>
              <p class="card-options">
                <a href="#" class="delete text-decoration-underline text-danger">delete</a> |
                <a href="#" class="edit text-decoration-underline text-primary">edit</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `);

    // toggle details
    card.find('.more-info').on('click', e => {
      e.preventDefault();
      const body = $(e.currentTarget).closest('.card-body');
      body.find('.more-details').slideToggle();
      body.closest('.expense-card').toggleClass('expanded');
    });

    // delete a card
    card.find('.delete').on('click', e => {
      e.preventDefault();
      const id = parseInt(card.attr('data-id'), 10);
      let ex = loadExpenses();
      const index = ex.findIndex(x => x.id === id);
      if (index > -1) {
        const [deleted] = ex.splice(index, 1);
        localStorage.setItem('expenses', JSON.stringify(ex));
        let removed = JSON.parse(localStorage.getItem('deletedExpenses')) || [];
        removed.push(deleted);
        localStorage.setItem('deletedExpenses', JSON.stringify(removed));
      }
      applyFilters();
    });

    // edit and show modal window
    card.find('.edit').on('click', e => {
      e.preventDefault();
      $('#edit-id').val(expense.id);
      $('#edit-title').val(expense.title);
      $('#edit-date').val(expense.date);
      $('#edit-amount').val(expense.amount);
      $('#edit-category').val(expense.category);
      $('#edit-description').val(expense.description);
      editModal.show();
    });

    $('#expense-cards-container').append(card);
  }

  // render the grid of cards based on current filters
  function applyFilters() {
    const filtered = getFilteredExpenses();
    $('#expense-cards-container').empty();
    if (filtered.length) {
      filtered.forEach(appendExpenseCard);
    } else {
      $('#expense-cards-container').html('<p class="text-muted">No expenses found.</p>');
    }
  }

  // convert current filtered expenses to CSV and trigger a download
  function downloadCSV() {
    const data = getFilteredExpenses();
    if (!data.length) {
      return alert('No expenses to export.');
    }

    // build CSV header
    const header = ['id','title','date','amount','category','description','edited'];
    const rows = data.map(exp => {
      // check if the expense has been edited
      let editedFlag;
      if (exp.edited) {
        editedFlag = 'yes';
      } else {
        editedFlag = 'no';
      }
    
      // now build and return the CSV line
      return [
        exp.id,
        `"${exp.title.replace(/"/g, '""')}"`,
        exp.date,
        exp.amount,
        exp.category,
        `"${(exp.description || '').replace(/"/g, '""')}"`,
        editedFlag
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // initiaize the modal window for editing
  const editModal = new bootstrap.Modal($('#editModal')[0]);
  applyFilters();

  // add new expense
  $('#expense-form').on('submit', function (e) {
    e.preventDefault();
    const newExp = {
      id: Date.now(),
      title: $('#expense-title').val().trim(),
      date: $('#expense-date').val(),
      amount: $('#expense-amount').val(),
      category: $('#expense-category').val(),
      description: $('#expense-description').val().trim()
    };
    if (!newExp.title || !newExp.date || !newExp.amount || !newExp.category) {
      return alert('Please fill in all required fields.');
    }
    const ex = loadExpenses();
    ex.push(newExp);
    localStorage.setItem('expenses', JSON.stringify(ex));
    applyFilters();
    this.reset();
  });

  // save edit from modal
  $('#save-edit').on('click', function () {
    const id = parseInt($('#edit-id').val(), 10);
    const ex = loadExpenses();
    const index = ex.findIndex(x => x.id === id);
    if (index > -1) {
      ex[index] = {
        ...ex[index],
        title: $('#edit-title').val().trim(),
        date: $('#edit-date').val(),
        amount: $('#edit-amount').val(),
        category: $('#edit-category').val(),
        description: $('#edit-description').val().trim(),
        edited: true
      };
      localStorage.setItem('expenses', JSON.stringify(ex));
      applyFilters();
      editModal.hide();
    }
  });

  // search button, don't let the page reload
  $('#expense-search-form').on('submit', function (e) {
    e.preventDefault();
    applyFilters();
  });

  // edited toggle
  $('#filter-edited-btn').on('click', function () {
    if (filterMode === 'edited') {
      filterMode = null;
      $(this).removeClass('active');
    } else {
      filterMode = 'edited';
      $(this).addClass('active');
      $('#filter-deleted-btn').removeClass('active');
    }
    applyFilters();
  });

  // deleated toggle
  $('#filter-deleted-btn').on('click', function () {
    if (filterMode === 'deleted') {
      filterMode = null;
      $(this).removeClass('active');
    } else {
      filterMode = 'deleted';
      $(this).addClass('active');
      $('#filter-edited-btn').removeClass('active');
    }
    applyFilters();
  });

  // export CSV button
  $('#download-csv-btn').on('click', downloadCSV);
});