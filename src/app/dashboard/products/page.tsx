'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import { Modal, useToast, usePersistentState } from '@/components/ui';

interface Product {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  category?: string;
  stockQuantity?: number | null;
  isActive: boolean;
  createdAt: string;
}

const seedProducts: Product[] = [
  {
    id: 'prod_tshirt',
    sku: 'TEE-BLK-M',
    name: 'ZeePay Tee — Black',
    description: 'Cotton crew-neck tee with embroidered logo',
    price: 18,
    currency: 'USD',
    images: [],
    category: 'Apparel',
    stockQuantity: 140,
    isActive: true,
    createdAt: '2024-01-08',
  },
  {
    id: 'prod_ebook',
    sku: 'EBOOK-FINTECH',
    name: 'Fintech in Zim — eBook',
    description: 'Digital download, PDF + ePub',
    price: 9.5,
    currency: 'USD',
    images: [],
    category: 'Digital',
    stockQuantity: null,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'prod_coffee',
    sku: 'COFFEE-1KG',
    name: 'Eastern Highlands Coffee 1kg',
    description: 'Single-origin arabica, medium roast',
    price: 12,
    currency: 'USD',
    images: [],
    category: 'Groceries',
    stockQuantity: 32,
    isActive: true,
    createdAt: '2024-02-02',
  },
];

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  price: '',
  currency: 'USD',
  category: '',
  stock: '',
  image: '',
};

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [products, persist] = usePersistentState<Product[]>('store-products', seedProducts);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, [router]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      price: product.price.toString(),
      currency: product.currency,
      category: product.category || '',
      stock: product.stockQuantity == null ? '' : product.stockQuantity.toString(),
      image: product.images[0] || '',
    });
    setShowModal(true);
  };

  const saveProduct = () => {
    const price = parseFloat(form.price);
    if (!form.name.trim() || isNaN(price) || price <= 0) {
      toast('Enter a product name and a valid price', { tone: 'warning' });
      return;
    }
    const stockQuantity = form.stock.trim() === '' ? null : Math.max(0, parseInt(form.stock, 10) || 0);
    const images = form.image.trim() ? [form.image.trim()] : [];

    if (editing) {
      const updated: Product = {
        ...editing,
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        price,
        currency: form.currency,
        category: form.category.trim() || undefined,
        stockQuantity,
        images,
      };
      persist(products.map((p) => (p.id === editing.id ? updated : p)));
      toast(`Product "${updated.name}" updated`);
    } else {
      const product: Product = {
        id: `prod_${Date.now().toString(36)}`,
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        price,
        currency: form.currency,
        category: form.category.trim() || undefined,
        stockQuantity,
        images,
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      persist([product, ...products]);
      toast(`Product "${product.name}" created — pull it on your site via GET /v1/products`);
    }
    setShowModal(false);
  };

  const toggleActive = (product: Product) => {
    persist(products.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p)));
    toast(product.isActive ? `${product.name} deactivated — hidden from storefront pulls` : `${product.name} reactivated`);
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const stockValue = products
    .filter((p) => p.isActive)
    .reduce((sum, p) => sum + p.price * (p.stockQuantity ?? 0), 0);

  const columns = [
    {
      key: 'name',
      label: 'Product',
      sortable: true,
      render: (value: string, row: Product) => (
        <div>
          <div className="fw-semibold">{value}</div>
          {row.sku && <div className="text-muted small">SKU {row.sku}</div>}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number, row: Product) => `${row.currency} ${value.toFixed(2)}`,
    },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'stockQuantity',
      label: 'Stock',
      sortable: true,
      render: (value: number | null | undefined) => (value == null ? 'Unlimited' : value),
    },
    { key: 'createdAt', label: 'Created', sortable: true },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => <StatusBadge status={value ? 'active' : 'cancelled'} type="default" size="sm" />,
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">Products</h2>
          <p className="text-muted mb-0">
            Your catalogue lives in ZeePay — your website pulls it with one API call and sells with productId
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <i className="bi bi-plus-circle me-2"></i>
          New Product
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Products</p>
                  <p className="h3 mb-0">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Products</p>
                  <p className="h3 mb-0">{products.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Inventory Value</p>
                  <p className="h3 mb-0 text-success">${stockValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Catalogue</h5>
            </div>
            <div className="card-body">
              <DataTable
                columns={columns}
                data={products}
                searchable
                searchableFields={['name', 'sku', 'category', 'description']}
                exportable
                exportName="products"
                rowActions={(row: Product) => (
                  <div className="d-flex gap-1 justify-content-end">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(row)}>
                      Edit
                    </button>
                    <button
                      className={`btn btn-sm ${row.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => toggleActive(row)}
                    >
                      {row.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Selling These on Your Site</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <h6 className="mb-1">Pull the catalogue</h6>
                  <p className="small text-muted mb-0">
                    <code>GET /v1/products?activeOnly=true</code> — render this list on your
                    storefront. ZeePay is the back store, your site is the front.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-1">Sell a product</h6>
                  <p className="small text-muted mb-0">
                    <code>POST /v1/payments</code> with <code>{`{ "productId": "...", "quantity": 1 }`}</code> —
                    price and currency come from the catalogue, so buyers can&apos;t tamper with amounts.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-1">Manage via API</h6>
                  <p className="small text-muted mb-0">
                    <code>POST /v1/products</code> / <code>PATCH /v1/products/:id</code> — keep stock
                    and prices in sync from your own admin tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <Modal open
          title={editing ? 'Edit Product' : 'New Product'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveProduct}>
                {editing ? 'Save changes' : 'Create product'}
              </button>
            </>
          }
        >
          <div className="row g-3 mb-3">
            <div className="col-md-8">
              <label className="form-label small">Product name *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small">SKU</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small">Description</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small">Price *</label>
              <input
                type="number"
                className="form-control form-control-sm"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small">Currency</label>
              <select
                className="form-select form-select-sm"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="ZWG">ZWG</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Category</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small">Stock quantity</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min="0"
                placeholder="Leave empty for unlimited"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Image URL</label>
              <input
                type="url"
                className="form-control form-control-sm"
                placeholder="https://…"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>
          </div>
          <p className="text-muted small mt-3 mb-0">
            Leave stock empty for digital goods and services — the product stays sellable forever.
          </p>
        </Modal>
      )}
    </>
  );
}
