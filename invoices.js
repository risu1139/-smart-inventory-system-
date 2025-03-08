document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentPage = 1;
    let entriesPerPage = 10;
    let currentSort = { column: null, direction: 'asc' };
    let originalData = [];
    let invoiceToDelete = null;
    
    // Get modal elements
    const deleteModal = document.getElementById('deleteModal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');

    // Get table elements
    const table = document.getElementById('invoicesTable');
    const tbody = table.querySelector('tbody');
    const searchInput = document.getElementById('searchInput');
    const entriesSelect = document.getElementById('entriesSelect');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.querySelector('.current-page');
    const totalPagesSpan = document.querySelector('.total-pages');

    // Store initial table data
    Array.from(tbody.rows).forEach(row => {
        originalData.push({
            index: row.cells[0].textContent,
            datetime: row.cells[1].textContent,
            transactionCode: row.cells[2].textContent,
            customer: row.cells[3].textContent,
            totalItems: parseInt(row.cells[4].textContent),
            totalAmount: row.cells[5].textContent,
            html: row.outerHTML
        });
    });

    function closeModals() {
        deleteModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Delete invoice
    function deleteInvoice(id) {
        const index = originalData.findIndex(item => item.index === id);
        if (index !== -1) {
            originalData.splice(index, 1);
            // Reindex remaining items
            originalData.forEach((item, i) => {
                item.index = (i + 1).toString();
                const tempRow = document.createElement('tr');
                tempRow.innerHTML = item.html;
                tempRow.cells[0].textContent = item.index;
                item.html = tempRow.outerHTML;
            });
            updateTable();
        }
        closeModals();
    }

    // Update action button listeners
    function attachActionListeners() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                const invoiceId = row.cells[0].textContent;
                const transactionCode = row.cells[2].textContent;
                invoiceToDelete = invoiceId;
                document.getElementById('deleteMessage').textContent = `Are you sure you want to delete invoice "${transactionCode}"?`;
                deleteModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            };
        });
    }

    // Sort table data
    function sortData(column) {
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }

        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        const currentIcon = document.querySelector(`[data-sort="${column}"] i`);
        if (currentIcon) {
            currentIcon.className = `fas fa-sort-${currentSort.direction === 'asc' ? 'up' : 'down'}`;
        }

        originalData.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];

            if (column === 'datetime') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            } else if (column === 'totalItems') {
                valueA = parseInt(valueA);
                valueB = parseInt(valueB);
            } else if (column === 'totalAmount') {
                valueA = parseFloat(valueA.replace('₹', '').replace(',', ''));
                valueB = parseFloat(valueB.replace('₹', '').replace(',', ''));
            }

            return currentSort.direction === 'asc' ? 
                (valueA > valueB ? 1 : -1) : 
                (valueA < valueB ? 1 : -1);
        });

        updateTable();
    }

    // Filter table data
    function filterData(searchTerm) {
        const filteredData = originalData.filter(item => {
            const searchString = searchTerm.toLowerCase();
            return (
                item.transactionCode.toLowerCase().includes(searchString) ||
                item.customer.toLowerCase().includes(searchString) ||
                item.totalAmount.toLowerCase().includes(searchString)
            );
        });

        return filteredData;
    }

    // Update table display
    function updateTable() {
        const filteredData = filterData(searchInput.value);
        const totalPages = Math.ceil(filteredData.length / entriesPerPage);
        
        // Update pagination controls
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Calculate start and end indices
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const paginatedData = filteredData.slice(start, end);

        // Update table content
        tbody.innerHTML = paginatedData.map((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = item.html;
            row.cells[0].textContent = start + index + 1;
            return row.outerHTML;
        }).join('');

        // Reattach event listeners for action buttons
        attachActionListeners();
    }

    // Event Listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });

    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeModals();
        }
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete);
        }
    });

    cancelDeleteBtn.addEventListener('click', closeModals);

    searchInput.addEventListener('input', function() {
        currentPage = 1;
        updateTable();
    });

    entriesSelect.addEventListener('change', function() {
        entriesPerPage = parseInt(this.value);
        currentPage = 1;
        updateTable();
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        const filteredData = filterData(searchInput.value);
        const totalPages = Math.ceil(filteredData.length / entriesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });

    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.dataset.sort;
            sortData(column);
        });
    });

    // Initialize table
    updateTable();
    attachActionListeners();
}); 