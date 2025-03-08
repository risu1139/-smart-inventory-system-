document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const productModal = document.getElementById('productModal');
    const deleteModal = document.getElementById('deleteModal');
    const productForm = document.getElementById('productForm');
    const addNewBtn = document.getElementById('addNewBtn');
    const modalTitle = document.getElementById('modalTitle');
    const closeButtons = document.querySelectorAll('.close-modal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const table = document.getElementById('productsTable');
    const tbody = table.querySelector('tbody');
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
        originalData: [],
        productToDelete: null
    };

    // Initialize data
    function initializeData() {
        Array.from(tbody.rows).forEach(row => {
            state.originalData.push({
                index: row.cells[0].textContent,
                datetime: row.cells[1].textContent,
                name: row.cells[2].textContent,
                description: row.cells[3].textContent,
                price: row.cells[4].textContent,
                status: row.cells[5].querySelector('.status-badge').textContent,
                html: row.outerHTML
            });
        });
    }

    // Modal Functions
    function openProductModal(mode = 'add', productData = null) {
        modalTitle.textContent = mode === 'add' ? 'Add New Product' : 'Edit Product';
        if (mode === 'edit' && productData) {
            document.getElementById('productName').value = productData.name;
            document.getElementById('productDescription').value = productData.description;
            document.getElementById('productPrice').value = productData.price.replace('₹', '').replace(',', '');
            document.getElementById('productStatus').value = productData.status.toLowerCase();
            document.getElementById('editProductId').value = productData.index;
        } else {
            productForm.reset();
            document.getElementById('editProductId').value = '';
        }
        productModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModals() {
        productModal.style.display = 'none';
        deleteModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Table Functions
    function updateTable() {
        const filteredData = filterData(searchInput.value);
        const totalPages = Math.ceil(filteredData.length / state.entriesPerPage);
        
        currentPageSpan.textContent = state.currentPage;
        totalPagesSpan.textContent = totalPages;
        prevPageBtn.disabled = state.currentPage === 1;
        nextPageBtn.disabled = state.currentPage === totalPages;

        const start = (state.currentPage - 1) * state.entriesPerPage;
        const end = start + state.entriesPerPage;
        const paginatedData = filteredData.slice(start, end);

        tbody.innerHTML = paginatedData.map((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = item.html;
            row.cells[0].textContent = start + index + 1;
            return row.outerHTML;
        }).join('');

        attachActionListeners();
    }

    function filterData(searchTerm) {
        return state.originalData.filter(item => {
            const searchString = searchTerm.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchString) ||
                item.description.toLowerCase().includes(searchString) ||
                item.status.toLowerCase().includes(searchString)
            );
        });
    }

    function sortData(column) {
        const sortableColumns = ['datetime', 'name', 'price', 'status'];
        if (!sortableColumns.includes(column)) return;

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
        currentIcon.className = `fas fa-sort-${state.currentSort.direction === 'asc' ? 'up' : 'down'}`;

        state.originalData.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];

            if (column === 'price') {
                valueA = parseFloat(valueA.replace('₹', '').replace(',', ''));
                valueB = parseFloat(valueB.replace('₹', '').replace(',', ''));
            } else if (column === 'datetime') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }

            return state.currentSort.direction === 'asc' ? 
                (valueA > valueB ? 1 : -1) : 
                (valueA < valueB ? 1 : -1);
        });

        updateTable();
    }

    // Event Handlers
    function handleFormSubmit(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: document.getElementById('productPrice').value,
            status: document.getElementById('productStatus').value,
            vendors: []
        };

        // Collect vendor data
        document.querySelectorAll('.vendor-entry').forEach(entry => {
            const inputs = entry.querySelectorAll('input');
            const vendor = {
                name: inputs[0].value,
                contact: inputs[1].value,
                email: inputs[2].value,
                phone: inputs[3].value,
                price: inputs[4].value
            };
            formData.vendors.push(vendor);
        });

        const editId = document.getElementById('editProductId').value;
        if (editId) {
            const index = state.originalData.findIndex(item => item.index === editId);
            if (index !== -1) {
                state.originalData[index] = {
                    ...state.originalData[index],
                    ...formData
                };
            }
        } else {
            const newId = (state.originalData.length + 1).toString();
            state.originalData.push({
                index: newId,
                datetime: new Date().toLocaleString(),
                ...formData
            });
        }

        updateTable();
        closeModals();
        productForm.reset();
        vendorList.innerHTML = ''; // Clear vendor list
    }

    function createProductHTML(data, id) {
        return `
            <tr>
                <td>${id}</td>
                <td>${data.datetime}</td>
                <td>${data.name}</td>
                <td>${data.description}</td>
                <td>₹${parseFloat(data.price).toLocaleString('en-IN')}</td>
                <td><span class="status-badge ${data.status}">${data.status}</span></td>
                <td class="action-buttons">
                    <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    function deleteProduct(id) {
        const index = state.originalData.findIndex(item => item.index === id);
        if (index !== -1) {
            state.originalData.splice(index, 1);
            state.originalData.forEach((item, i) => {
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

    function attachActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                openProductModal('edit', {
                    index: row.cells[0].textContent,
                    datetime: row.cells[1].textContent,
                    name: row.cells[2].textContent,
                    description: row.cells[3].textContent,
                    price: row.cells[4].textContent,
                    status: row.cells[5].querySelector('.status-badge').textContent
                });
            };
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                state.productToDelete = row.cells[0].textContent;
                document.getElementById('deleteMessage').textContent = 
                    `Are you sure you want to delete "${row.cells[2].textContent}"?`;
                deleteModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            };
        });
    }

    // Event listeners
    addNewBtn.addEventListener('click', () => openProductModal('add'));
    closeButtons.forEach(button => button.addEventListener('click', closeModals));
    window.addEventListener('click', (e) => {
        if (e.target === productModal || e.target === deleteModal) closeModals();
    });
    productForm.addEventListener('submit', handleFormSubmit);
    confirmDeleteBtn.addEventListener('click', () => {
        if (state.productToDelete) deleteProduct(state.productToDelete);
    });
    cancelDeleteBtn.addEventListener('click', closeModals);
    searchInput.addEventListener('input', () => {
        state.currentPage = 1;
        updateTable();
    });
    entriesSelect.addEventListener('change', () => {
        state.entriesPerPage = parseInt(entriesSelect.value);
        state.currentPage = 1;
        updateTable();
    });
    prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            updateTable();
        }
    });
    nextPageBtn.addEventListener('click', () => {
        const filteredData = filterData(searchInput.value);
        const totalPages = Math.ceil(filteredData.length / state.entriesPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            updateTable();
        }
    });
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortData(th.dataset.sort));
    });

    // Vendor Management
    const addVendorBtn = document.getElementById('addVendorBtn');
    const vendorList = document.getElementById('vendorList');
    let vendorCount = 0;

    function addVendorField() {
        vendorCount++;
        const vendorEntry = document.createElement('div');
        vendorEntry.className = 'vendor-entry';
        vendorEntry.innerHTML = `
            <div class="vendor-fields">
                <input type="text" name="vendor_name_${vendorCount}" placeholder="Vendor Name" required>
                <input type="text" name="vendor_contact_${vendorCount}" placeholder="Contact Person" required>
                <input type="email" name="vendor_email_${vendorCount}" placeholder="Email" required>
                <input type="tel" name="vendor_phone_${vendorCount}" placeholder="Phone" required>
                <input type="number" name="vendor_price_${vendorCount}" placeholder="Price Offered" min="0" step="0.01" required>
                <button type="button" class="remove-vendor-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        vendorList.appendChild(vendorEntry);

        // Add remove button functionality
        vendorEntry.querySelector('.remove-vendor-btn').addEventListener('click', function() {
            vendorEntry.remove();
        });
    }

    addVendorBtn.addEventListener('click', addVendorField);

    // Initialize
    initializeData();
    updateTable();
}); 