document.addEventListener('DOMContentLoaded', function () {
  const placeholderImage = '/images/placeholder-80.png';
  const modalEl = document.getElementById('productModal');
  const productForm = document.getElementById('product-form');
  const productGrid = document.getElementById('product-grid');
  const imageFileInput = document.getElementById('imageFile');
  const previewImage = document.getElementById('img-preview');
  const formStatus = document.getElementById('form-status');
  const modalTitle = document.getElementById('modalTitle');
  const saveButton = document.getElementById('modal-save');
  const modal = modalEl && typeof bootstrap !== 'undefined' ? new bootstrap.Modal(modalEl) : null;

  function setFormStatus(message, tone) {
    if (!formStatus) return;
    formStatus.textContent = message || '';
    if (tone) formStatus.dataset.tone = tone;
    else delete formStatus.dataset.tone;
  }

  function resetFormState() {
    if (!productForm) return;
    productForm.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('imageUrl').value = '';
    if (previewImage) previewImage.src = placeholderImage;
    if (saveButton) saveButton.textContent = 'Save product';
    setFormStatus('');
  }

  function getCardData(card) {
    if (!card) return null;
    return {
      id: card.dataset.id || '',
      name: card.dataset.name || '',
      price: card.dataset.price || '',
      color: card.dataset.color || '',
      description: card.dataset.description || '',
      image: card.dataset.image || ''
    };
  }

  function openModalForAdd() {
    resetFormState();
    if (modalTitle) modalTitle.textContent = 'Add Product';
    if (saveButton) saveButton.textContent = 'Save product';
    if (modal) modal.show();
  }

  function openModalForEdit(card) {
    const data = getCardData(card);
    if (!data) return;
    resetFormState();
    if (modalTitle) modalTitle.textContent = 'Edit Product';
    if (saveButton) saveButton.textContent = 'Update product';
    document.getElementById('product-id').value = data.id;
    document.getElementById('name').value = data.name;
    document.getElementById('price').value = data.price;
    document.getElementById('color').value = data.color;
    document.getElementById('description').value = data.description;
    document.getElementById('imageUrl').value = data.image;
    if (previewImage) previewImage.src = data.image || placeholderImage;
    if (modal) modal.show();
  }

  async function handleDelete(card) {
    const id = card && card.dataset.id;
    if (!id) return;
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await fetch(`/products/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        let payload = {};
        try {
          payload = await response.json();
        } catch (error) {
          payload = {};
        }
        window.alert(payload.message || 'Delete failed');
        return;
      }
      window.location.reload();
    } catch (error) {
      window.alert('Delete failed');
    }
  }

  document.querySelectorAll('[data-open-product-modal]').forEach(function (button) {
    button.addEventListener('click', openModalForAdd);
  });

  document.querySelectorAll('.feature-card .btn-edit').forEach(function (button) {
    button.addEventListener('click', function () {
      openModalForEdit(button);
    });
  });

  if (productGrid) {
    productGrid.addEventListener('click', function (event) {
      const card = event.target.closest('[data-product-card]');
      if (!card) return;

      if (event.target.closest('.btn-edit')) {
        openModalForEdit(card);
      }

      if (event.target.closest('.btn-delete')) {
        handleDelete(card);
      }
    });
  }

  if (productForm) {
    productForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const id = document.getElementById('product-id').value;
      const name = document.getElementById('name').value.trim();
      const price = Number(document.getElementById('price').value);
      const color = document.getElementById('color').value.trim();

      if (!name || !color || Number.isNaN(price) || price < 0) {
        const message = 'Please provide a valid name, price, and color.';
        setFormStatus(message, 'error');
        window.alert(message);
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      formData.append('color', color);
      formData.append('description', document.getElementById('description').value.trim());

      const file = imageFileInput && imageFileInput.files ? imageFileInput.files[0] : null;
      if (file) formData.append('imageFile', file);

      const method = id ? 'PATCH' : 'POST';
      const url = id ? `/products/${id}` : '/products';
      const idleButtonText = id ? 'Update product' : 'Save product';

      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = id ? 'Updating...' : 'Saving...';
      }
      setFormStatus('Saving changes...', '');

      try {
        const response = await fetch(url, { method, body: formData });
        if (response.ok) {
          setFormStatus('Saved. Refreshing the catalog...', 'success');
          window.location.reload();
          return;
        }

        let payload = {};
        try {
          payload = await response.json();
        } catch (error) {
          payload = {};
        }

        const message = payload.errors
          ? payload.errors.map(function (item) { return item.msg; }).join('\n')
          : (payload.message || 'Save failed');

        setFormStatus(message, 'error');
        window.alert(message);
      } catch (error) {
        setFormStatus('Save failed. Please try again.', 'error');
        window.alert('Save failed');
      } finally {
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = idleButtonText;
        }
      }
    });
  }

  if (imageFileInput) {
    imageFileInput.addEventListener('change', function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file || !previewImage) {
        if (previewImage) previewImage.src = placeholderImage;
        return;
      }

      const reader = new FileReader();
      reader.onload = function (loadEvent) {
        previewImage.src = loadEvent.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', resetFormState);
  }

  const searchInput = document.getElementById('inventory-search');
  const colorFilter = document.getElementById('inventory-color-filter');
  const sortSelect = document.getElementById('inventory-sort');
  const inventoryCount = document.getElementById('inventory-count');
  const inventoryEmpty = document.getElementById('inventory-empty');

  function sortCards(cards, sortValue) {
    return cards.sort(function (left, right) {
      const leftName = (left.dataset.name || '').toLowerCase();
      const rightName = (right.dataset.name || '').toLowerCase();
      const leftPrice = Number(left.dataset.price || 0);
      const rightPrice = Number(right.dataset.price || 0);

      if (sortValue === 'price-desc') return rightPrice - leftPrice;
      if (sortValue === 'price-asc') return leftPrice - rightPrice;
      if (sortValue === 'name-asc') return leftName.localeCompare(rightName);
      return 0;
    });
  }

  function applyInventoryFilters() {
    if (!productGrid) return;

    const allCards = Array.from(productGrid.querySelectorAll('[data-product-card]'));
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const color = colorFilter ? colorFilter.value.trim().toLowerCase() : '';
    const sortValue = sortSelect ? sortSelect.value : 'featured';

    const visibleCards = [];

    allCards.forEach(function (card) {
      const name = (card.dataset.name || '').toLowerCase();
      const description = (card.dataset.description || '').toLowerCase();
      const cardColor = (card.dataset.color || '').toLowerCase();
      const matchesQuery = !query || name.includes(query) || description.includes(query);
      const matchesColor = !color || cardColor === color;
      const visible = matchesQuery && matchesColor;
      card.hidden = !visible;
      if (visible) visibleCards.push(card);
    });

    sortCards(visibleCards, sortValue).forEach(function (card) {
      productGrid.appendChild(card);
    });

    if (inventoryCount) {
      inventoryCount.textContent = `${visibleCards.length} ${visibleCards.length === 1 ? 'product' : 'products'}`;
    }

    if (inventoryEmpty) {
      inventoryEmpty.hidden = visibleCards.length !== 0;
    }
  }

  [searchInput, colorFilter, sortSelect].forEach(function (control) {
    if (!control) return;
    control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', applyInventoryFilters);
  });

  applyInventoryFilters();
});
