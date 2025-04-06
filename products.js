document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const productModal = document.getElementById('productModal');
    const deleteModal = document.getElementById('deleteModal');
    const qrModal = document.getElementById('qrModal');
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
    const addVendorBtn = document.getElementById('addVendorBtn');
    const vendorList = document.getElementById('vendorList');

    // Initialize state
    let state = {
        currentPage: 1,
        entriesPerPage: 10,
        currentSort: { column: null, direction: 'asc' },
        originalData: [],
        productToDelete: null,
        currentQRProduct: null
    };

    let vendorCount = 0;

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
                vendors: [],
                qrCode: null,
                qrImage: null,
                html: row.outerHTML
            });
        });
    }

    // Modal Functions
    function openProductModal(mode = 'add', productData = null) {
        modalTitle.textContent = mode === 'add' ? 'Add New Product' : 'Edit Product';
        
        // Clear existing vendor entries and reset form
        vendorList.innerHTML = '';
        
        // Hide print copies section if visible
        const printCopies = document.querySelector('#productModal .print-copies');
        if (printCopies) {
            printCopies.style.display = 'none';
        }
        
        // Get QR canvas element
        const qrCanvas = document.getElementById('editQrCanvas');
        // Clear any existing QR code
        const ctx = qrCanvas.getContext('2d');
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        
        if (mode === 'edit' && productData) {
            document.getElementById('productName').value = productData.name;
            document.getElementById('productDescription').value = productData.description;
            document.getElementById('productPrice').value = productData.price.replace('₹', '').replace(',', '');
            document.getElementById('productStatus').value = productData.status.toLowerCase();
            document.getElementById('editProductId').value = productData.index;

            // Display existing QR code or generate a new one
            if (productData.qrImage) {
                // If we already have a QR image, display it
                const img = new Image();
                img.onload = function() {
                    const ctx = qrCanvas.getContext('2d');
                    qrCanvas.width = img.width;
                    qrCanvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                };
                img.src = productData.qrImage;
            } else {
                // Generate a new QR code
                generateQRCode(productData.name, qrCanvas).then(qrData => {
                    productData.qrCode = qrData.qr_data;
                    productData.qrImage = qrData.qr_code;
                });
            }

            // Add existing vendors if any
            if (productData.vendors && productData.vendors.length > 0) {
                productData.vendors.forEach(vendor => {
                    vendorCount++;
                    const vendorEntry = document.createElement('div');
                    vendorEntry.className = 'vendor-entry';
                    vendorEntry.innerHTML = `
                        <div class="vendor-fields">
                            <input type="text" name="vendor_name_${vendorCount}" value="${vendor.name || ''}" placeholder="Vendor Name" required>
                            <input type="text" name="vendor_contact_${vendorCount}" value="${vendor.contact || ''}" placeholder="Contact Person" required>
                            <input type="email" name="vendor_email_${vendorCount}" value="${vendor.email || ''}" placeholder="Email" required>
                            <input type="tel" name="vendor_phone_${vendorCount}" value="${vendor.phone || ''}" placeholder="Phone" required>
                            <input type="number" name="vendor_price_${vendorCount}" value="${vendor.price || ''}" placeholder="Price Offered" min="0" step="0.01" required>
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
                });
            }
        } else {
            productForm.reset();
            document.getElementById('editProductId').value = '';
            
            // Generate new QR code for new products
            generateQRCode('new_product', qrCanvas).then(qrData => {
                state.currentQRData = qrData;
            });
        }
        
        productModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModals() {
        productModal.style.display = 'none';
        deleteModal.style.display = 'none';
        if (qrModal) qrModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Table Functions
    function updateTable() {
        const filteredData = filterData(searchInput.value);
        const totalPages = Math.ceil(filteredData.length / state.entriesPerPage);
        
        currentPageSpan.textContent = state.currentPage;
        totalPagesSpan.textContent = totalPages || 1;
        prevPageBtn.disabled = state.currentPage === 1;
        nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;

        const start = (state.currentPage - 1) * state.entriesPerPage;
        const end = start + state.entriesPerPage;
        const paginatedData = filteredData.slice(start, end);

        tbody.innerHTML = paginatedData.map((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = createProductHTML(item, (start + index + 1).toString());
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
            vendors: [],
            qrCode: null,
            qrImage: null
        };

        // Get QR code data
        const editId = document.getElementById('editProductId').value;
        if (editId) {
            const index = state.originalData.findIndex(item => item.index === editId);
            if (index !== -1) {
                formData.qrCode = state.originalData[index].qrCode;
                formData.qrImage = state.originalData[index].qrImage;
            }
        } else if (state.currentQRData) {
            formData.qrCode = state.currentQRData.qr_data;
            formData.qrImage = state.currentQRData.qr_code;
        }

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

        if (editId) {
            const index = state.originalData.findIndex(item => item.index === editId);
            if (index !== -1) {
                const updatedProduct = {
                    ...state.originalData[index],
                    name: formData.name,
                    description: formData.description,
                    price: formData.price,
                    status: formData.status,
                    vendors: formData.vendors,
                    qrCode: formData.qrCode,
                    qrImage: formData.qrImage
                };
                state.originalData[index] = updatedProduct;
            }
        } else {
            const newId = (state.originalData.length + 1).toString();
            const newProduct = {
                index: newId,
                datetime: new Date().toLocaleString(),
                ...formData
            };
            state.originalData.push(newProduct);
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
                <td><span class="status-badge ${data.status.toLowerCase()}">${data.status}</span></td>
                <td class="action-buttons">
                    <button class="edit-btn" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                    <button class="analysis-btn" title="Analysis"><i class="fas fa-chart-line"></i></button>
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
            });
            updateTable();
        }
        closeModals();
    }

    function attachActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                const productId = row.cells[0].textContent;
                const productData = state.originalData.find(item => item.index === productId) || {
                    index: productId,
                    datetime: row.cells[1].textContent,
                    name: row.cells[2].textContent,
                    description: row.cells[3].textContent,
                    price: row.cells[4].textContent,
                    status: row.cells[5].querySelector('.status-badge').textContent,
                    vendors: [],
                    qrCode: null,
                    qrImage: null
                };
                openProductModal('edit', productData);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                state.productToDelete = row.cells[0].textContent;
                document.getElementById('deleteMessage').textContent = 
                    `Are you sure you want to delete "${row.cells[2].textContent}"?`;
                deleteModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            });
        });
        
        // Add event listener for the new analysis button
        document.querySelectorAll('.analysis-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                const productName = row.cells[2].textContent;
                // Redirect to inventory page with the product name as a parameter
                window.location.href = `inventory.html?product=${encodeURIComponent(productName)}`;
            });
        });
    }

    // Event listeners
    addNewBtn.addEventListener('click', () => openProductModal('add'));
    closeButtons.forEach(button => button.addEventListener('click', closeModals));
    window.addEventListener('click', (e) => {
        if (e.target === productModal || e.target === deleteModal || e.target === qrModal) closeModals();
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
    addVendorBtn.addEventListener('click', addVendorField);
    
    // Add QR code button event listeners
    document.querySelector('.regenerate-qr-btn').addEventListener('click', regenerateQRCode);
    document.querySelector('.print-qr-btn').addEventListener('click', showPrintOptions);
    document.querySelector('.confirm-print-btn').addEventListener('click', printQRCode);

    // Vendor Management
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

    // QR Code Functions
    async function generateQRCode(productName, canvas) {
        try {
            console.log("Generating QR code for:", productName);
            
            // Use the Python backend for QR code generation
            const response = await fetch('http://127.0.0.1:5001/generate-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: productName + '_' + Date.now()
                }),
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            
            const qrData = await response.json();
            console.log("QR data received:", qrData);
            
            // Display the QR code image
            const img = new Image();
            img.onload = function() {
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = qrData.qr_code;
            
            return qrData;
        } catch (error) {
            console.error('Error generating QR code:', error);
            // Fallback to client-side generation
            console.log("Using client-side fallback for QR code generation");
            const qrData = 'SMART_INV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Use client-side QR code generation
            QRCode.toCanvas(canvas, qrData, { 
                width: 200,
                height: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function (error) {
                if (error) console.error("Client-side QR generation error:", error);
                console.log("Client-side QR code generated successfully");
            });
            
            return {
                qr_data: qrData,
                qr_code: canvas.toDataURL()
            };
        }
    }

    function regenerateQRCode() {
        const canvas = document.getElementById('editQrCanvas');
        const productName = document.getElementById('productName').value || 'product';
        
        generateQRCode(productName, canvas).then(qrData => {
            const editId = document.getElementById('editProductId').value;
            if (editId) {
                const index = state.originalData.findIndex(item => item.index === editId);
                if (index !== -1) {
                    state.originalData[index].qrCode = qrData.qr_data;
                    state.originalData[index].qrImage = qrData.qr_code;
                }
            } else {
                state.currentQRData = qrData;
            }
        });
    }

    function showPrintOptions() {
        const printCopies = document.querySelector('#productModal .print-copies');
        if (printCopies) {
            printCopies.style.display = 'flex';
        }
    }

    function printQRCode() {
        const copies = parseInt(document.getElementById('editCopyCount').value) || 1;
        const canvas = document.getElementById('editQrCanvas');
        const productName = document.getElementById('productName').value;
        const productPrice = '₹' + document.getElementById('productPrice').value;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Print QR Code</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            .qr-print-container { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 20px; 
                padding: 20px;
            }
            .qr-item {
                text-align: center;
                padding: 10px;
                border: 1px dashed #ccc;
            }
            .qr-item p {
                margin: 5px 0;
                font-family: Arial, sans-serif;
            }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write('<div class="qr-print-container">');

        // Create multiple copies
        for (let i = 0; i < copies; i++) {
            printWindow.document.write('<div class="qr-item">');
            printWindow.document.write(`<img src="${canvas.toDataURL()}" />`);
            printWindow.document.write(`<p>${productName}</p>`);
            printWindow.document.write(`<p>${productPrice}</p>`);
            printWindow.document.write('</div>');
        }

        printWindow.document.write('</div></body></html>');
        printWindow.document.close();

        // Wait for images to load before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);

        // Hide print options
        const printCopies = document.querySelector('#productModal .print-copies');
        if (printCopies) {
            printCopies.style.display = 'none';
        }
    }

    // Initialize
    initializeData();
    updateTable();
}); 