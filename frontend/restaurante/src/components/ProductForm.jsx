import { useState, useRef } from 'react';

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="140"' +
  ' viewBox="0 0 200 140"%3E%3Crect width="200" height="140" fill="%23f0f0f0"/%3E' +
  '%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="32" fill="%23bbb"' +
  ' dominant-baseline="middle" text-anchor="middle"%3E🍽️%3C/text%3E%3C/svg%3E';

export default function ProductForm({ product, onSave, onCancel, saving }) {
  const isEdit = Boolean(product);

  const [name,        setName]        = useState(product?.name        ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price,       setPrice]       = useState(product?.price       ?? '');
  const [available,   setAvailable]   = useState(product?.available   ?? true);
  const [imageFile,   setImageFile]   = useState(null);
  const [preview,     setPreview]     = useState(product?.image_url   ?? null);
  const [errors,      setErrors]      = useState({});

  const fileRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function validate() {
    const errs = {};
    if (!name.trim())                              errs.name  = 'Nome é obrigatório.';
    if (price === '' || isNaN(Number(price)))       errs.price = 'Preço inválido.';
    else if (Number(price) < 0)                    errs.price = 'Preço não pode ser negativo.';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const fd = new FormData();
    fd.append('name',        name.trim());
    fd.append('description', description.trim());
    fd.append('price',       Number(price));
    fd.append('available',   String(available));
    if (imageFile) fd.append('image', imageFile);

    onSave(fd);
  }

  return (
    <div className="pf-overlay" onClick={onCancel}>
      <div
        className="pf"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Editar produto' : 'Novo produto'}
      >
        <div className="pf__header">
          <h2 className="pf__title">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button className="pf__close" onClick={onCancel} aria-label="Fechar">✕</button>
        </div>

        <form className="pf__form" onSubmit={handleSubmit} noValidate>

          {/* Imagem */}
          <div className="pf__image-area">
            <img
              className="pf__image-preview"
              src={preview || PLACEHOLDER}
              alt="Prévia da imagem do produto"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
            />
            <div className="pf__image-controls">
              <button type="button" className="pf__image-btn" onClick={() => fileRef.current?.click()}>
                {preview ? '🔄 Trocar imagem' : '📷 Adicionar imagem'}
              </button>
              {preview && (
                <button type="button" className="pf__image-remove" onClick={handleRemoveImage}>
                  Remover imagem
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <span className="pf__image-hint">JPEG, PNG, WEBP ou GIF — máx. 5 MB</span>
            </div>
          </div>

          {/* Nome */}
          <div className="pf__field">
            <label className="pf__label" htmlFor="pf-name">
              Nome <span className="pf__required">*</span>
            </label>
            <input
              id="pf-name"
              type="text"
              maxLength={100}
              className={`pf__input ${errors.name ? 'pf__input--error' : ''}`}
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
            />
            {errors.name && <span className="pf__error-msg">{errors.name}</span>}
          </div>

          {/* Descrição */}
          <div className="pf__field">
            <label className="pf__label" htmlFor="pf-desc">Descrição</label>
            <textarea
              id="pf-desc"
              className="pf__textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Preço */}
          <div className="pf__field">
            <label className="pf__label" htmlFor="pf-price">
              Preço (R$) <span className="pf__required">*</span>
            </label>
            <input
              id="pf-price"
              type="number"
              min="0"
              step="0.01"
              className={`pf__input ${errors.price ? 'pf__input--error' : ''}`}
              value={price}
              onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: undefined })); }}
            />
            {errors.price && <span className="pf__error-msg">{errors.price}</span>}
          </div>

          {/* Disponível */}
          <label className="pf__toggle-label">
            <input
              type="checkbox"
              className="pf__toggle"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            <span>Disponível no cardápio</span>
          </label>

          <div className="pf__footer">
            <button type="button" className="pf__btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="pf__btn-save" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
