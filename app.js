$(document).ready(function () {
  // ensure all expenses have a unique id property
  function ensureExpenseIds(expenses) {
    let updated = false;
    expenses.forEach(expense => {
      if (!expense.id) {
        expense.id = Date.now() + Math.floor(Math.random() * 1000);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
    return expenses;
  }

  // load expenses from localStorage ensure each has an id and render them
  function loadExpenses() {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses = ensureExpenseIds(expenses);
    $('#expense-cards-container').empty();
    expenses.forEach(expense => {
      appendExpenseCard(expense);
    });
  }

  // append a new expense card to the grid
  function appendExpenseCard(expense) {
    const cardHtml = `
      <div class="col-md-4 mb-3" data-id="${expense.id}">
        <div class="card expense-card" data-id="${expense.id}">
          <div class="card-body">
            <h5 class="card-title">${expense.title}</h5>
            <p class="card-text">Amount: $${parseFloat(expense.amount).toFixed(2)} | Date: ${expense.date}</p>
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
    `;
    $('#expense-cards-container').append(cardHtml);
  }

  // handle expense entry form submission
  $('#expense-form').on('submit', function (e) {
    e.preventDefault();

    // get form values
    const title = $('#expense-title').val().trim();
    const date = $('#expense-date').val();
    const amount = $('#expense-amount').val();
    const category = $('#expense-category').val();
    const description = $('#expense-description').val().trim();

    // validate required fields
    if (!title || !date || !amount || !category) {
      alert('Please fill in all required fields.');
      return;
    }

    // create expense object with a unique id
    const expense = {
      id: Date.now(),
      title,
      date,
      amount,
      category,
      description
    };

    // retrieve existing expenses from localStorage add new expense and update storage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // append the new expense card to the DOM
    appendExpenseCard(expense);

    // reset the form
    $('#expense-form')[0].reset();
  });

  // toggle more info to show/hide details
  $('#expense-cards-container').on('click', '.more-info', function (event) {
    event.preventDefault();
    const $card = $(this).closest('.expense-card');
    $card.toggleClass('expanded');
    $card.find('.more-details').slideToggle();
  });

  // delete expense card update storage and rerender the grid
  $('#expense-cards-container').on('click', '.delete', function (event) {
    event.preventDefault();

    // find the closest .col-md-4 element that holds the card (and its data-id)
    const $cardContainer = $(this).closest('.col-md-4');
    const expenseId = parseInt($cardContainer.attr('data-id'), 10);
    console.log("Attempting to delete expense with id:", expenseId);

    // retrieve current expenses from localStorage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // find the expense's index using a numeric comparison
    const expenseIndex = expenses.findIndex(exp => parseInt(exp.id, 10) === expenseId);
    if (expenseIndex !== -1) {
      // remove the expense from the active list
      const deletedExpense = expenses.splice(expenseIndex, 1)[0];
      // update localStorage with remaining expenses
      localStorage.setItem('expenses', JSON.stringify(expenses));

      // save the deleted expense separately
      let deletedExpenses = JSON.parse(localStorage.getItem('deletedExpenses')) || [];
      deletedExpenses.push(deletedExpense);
      localStorage.setItem('deletedExpenses', JSON.stringify(deletedExpenses));
    }

    // remove the card element
    $cardContainer.remove();

    // rerender the grid so that all remaining cards are in proper order
    loadExpenses();
  });

  // load expenses when the page loads
  loadExpenses();
});