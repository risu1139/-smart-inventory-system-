document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const inventoryTable = document.getElementById('inventoryTable');
    const productDetails = document.getElementById('productDetails');
    const historyTable = document.getElementById('historyTable');
    const addStockModal = document.getElementById('addStockModal');
    const addStockForm = document.getElementById('addStockForm');
    const addStockBtn = document.getElementById('addStockBtn');
    const closeButtons = document.querySelectorAll('.close-modal');
    const searchInput = document.getElementById('searchInput');
    const entriesSelect = document.getElementById('entriesSelect');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.querySelector('.current-page');
    const totalPagesSpan = document.querySelector('.total-pages');

    // Initialize state
    let state = {
        currentPage: 1,
        entriesPerPage: 10,
        currentSort: { column: null, direction: 'asc' },
        selectedProduct: null,
        stockHistory: []
    };

    // Check URL parameters for product information
    function parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const productParam = urlParams.get('product');
        
        if (productParam) {
            // Find the product in the table
            const rows = inventoryTable.querySelectorAll('tbody tr');
            for (const row of rows) {
                const productName = row.querySelector('td:nth-child(2)').textContent;
                if (productName === productParam || decodeURIComponent(productParam) === productName) {
                    // Extract data and show product details
                    const code = row.querySelector('td:first-child').textContent;
                    const name = productName;
                    showProductFromUrl(code, name);
                    return;
                }
            }
            
            // If product not found in table, create mock data
            showProductFromUrl('PROD' + Math.floor(Math.random() * 1000), decodeURIComponent(productParam));
        }
    }
    
    // Show product details from URL parameter
    function showProductFromUrl(code, name) {
        // Create mock product data
        const productData = {
            code: code,
            name: name,
            currentStock: Math.floor(Math.random() * 200),
            lastUpdated: new Date().toLocaleString()
        };
        
        // Show product details
        handleViewProduct(productData);
        
        // Scroll to product details
        productDetails.scrollIntoView({ behavior: 'smooth' });
    }

    // Sample stock history data (replace with actual data from backend)
    const sampleStockHistory = [
        {
            id: 1,
            datetime: '2022-03-21 01:38 PM',
            quantity: 20,
            type: 'Stock In',
            canEdit: true
        },
        {
            id: 2,
            datetime: '2022-03-21 01:40 PM',
            quantity: 25,
            type: 'Stock In',
            canEdit: true
        },
        {
            id: 3,
            datetime: '2022-03-21 05:05 PM',
            quantity: 5,
            type: 'Stock Out',
            canEdit: false
        }
    ];

    // Event Handlers
    function handleViewProduct(productData) {
        state.selectedProduct = productData;
        state.stockHistory = sampleStockHistory;
        
        // Update product details
        document.getElementById('productCode').textContent = productData.code;
        document.getElementById('productName').textContent = productData.name;
        document.getElementById('productDescription').textContent = productData.description;
        document.getElementById('productPrice').textContent = productData.price;

        // Show product details section
        productDetails.classList.remove('hidden');
        
        // Update stock history table
        updateHistoryTable();
        
        // Scroll to product details
        productDetails.scrollIntoView({ behavior: 'smooth' });
    }

    function updateHistoryTable() {
        const filteredData = filterHistoryData(searchInput.value);
        const totalPages = Math.ceil(filteredData.length / state.entriesPerPage);
        
        currentPageSpan.textContent = state.currentPage;
        totalPagesSpan.textContent = totalPages;
        prevPageBtn.disabled = state.currentPage === 1;
        nextPageBtn.disabled = state.currentPage === totalPages;

        const start = (state.currentPage - 1) * state.entriesPerPage;
        const end = start + state.entriesPerPage;
        const paginatedData = filteredData.slice(start, end);

        const tbody = historyTable.querySelector('tbody');
        tbody.innerHTML = paginatedData.map((item, index) => `
            <tr>
                <td>${start + index + 1}</td>
                <td>${item.datetime}</td>
                <td>${item.quantity}</td>
                <td>
                    <span class="status-badge ${item.type === 'Stock In' ? 'active' : 'inactive'}">
                        ${item.type}
                    </span>
                </td>
                <td class="action-buttons">
                    ${item.canEdit ? `
                        <button class="edit-btn" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                    ` : '-----'}
                </td>
            </tr>
        `).join('');

        attachHistoryActionListeners();
    }

    function filterHistoryData(searchTerm) {
        return state.stockHistory.filter(item => {
            const searchString = searchTerm.toLowerCase();
            return (
                item.datetime.toLowerCase().includes(searchString) ||
                item.type.toLowerCase().includes(searchString) ||
                item.quantity.toString().includes(searchString)
            );
        });
    }

    function sortHistoryData(column) {
        if (state.currentSort.column === column) {
            state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.currentSort.column = column;
            state.currentSort.direction = 'asc';
        }

        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        const currentIcon = document.querySelector(`[data-sort="${column}"] i`);
        if (currentIcon) {
            currentIcon.className = `fas fa-sort-${state.currentSort.direction === 'asc' ? 'up' : 'down'}`;
        }

        state.stockHistory.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];

            if (column === 'datetime') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            } else if (column === 'quantity') {
                valueA = parseInt(valueA);
                valueB = parseInt(valueB);
            }

            return state.currentSort.direction === 'asc' ? 
                (valueA > valueB ? 1 : -1) : 
                (valueA < valueB ? 1 : -1);
        });

        updateHistoryTable();
    }

    function handleAddStock(e) {
        e.preventDefault();
        const quantity = parseInt(document.getElementById('stockQuantity').value);
        
        if (quantity < 1) {
            alert('Please enter a valid quantity');
            return;
        }

        // Add new stock entry
        const newEntry = {
            id: state.stockHistory.length + 1,
            datetime: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            quantity: quantity,
            type: 'Stock In',
            canEdit: true
        };

        state.stockHistory.unshift(newEntry);
        updateHistoryTable();
        closeModals();
        addStockForm.reset();
    }

    function attachHistoryActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                // Implement edit functionality
                console.log('Edit entry:', row.cells[0].textContent);
            };
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                const index = parseInt(row.cells[0].textContent) - 1;
                if (confirm('Are you sure you want to delete this entry?')) {
                    state.stockHistory.splice(index, 1);
                    updateHistoryTable();
                }
            };
        });
    }

    function closeModals() {
        addStockModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Attach event listeners
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const row = this.closest('tr');
            const [code, name] = row.cells[1].textContent.split(' - ');
            handleViewProduct({
                code: code,
                name: name,
                description: 'Sample Product only',
                price: '150.59'
            });
        };
    });

    addStockBtn.addEventListener('click', () => {
        addStockModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });

    window.addEventListener('click', (e) => {
        if (e.target === addStockModal) closeModals();
    });

    addStockForm.addEventListener('submit', handleAddStock);

    searchInput.addEventListener('input', () => {
        state.currentPage = 1;
        updateHistoryTable();
    });

    entriesSelect.addEventListener('change', () => {
        state.entriesPerPage = parseInt(entriesSelect.value);
        state.currentPage = 1;
        updateHistoryTable();
    });

    prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            updateHistoryTable();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const filteredData = filterHistoryData(searchInput.value);
        const totalPages = Math.ceil(filteredData.length / state.entriesPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            updateHistoryTable();
        }
    });

    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortHistoryData(th.dataset.sort));
    });

    // Initialize the page with the first product's details
    const firstRow = inventoryTable.querySelector('tbody tr');
    if (firstRow) {
        const [code, name] = firstRow.cells[1].textContent.split(' - ');
        handleViewProduct({
            code: code,
            name: name,
            description: 'Sample Product only',
            price: '150.59'
        });
    }

    // Initialize
    attachHistoryActionListeners();
    
    // Parse URL parameters to check if a product was specified
    parseUrlParams();
}); 