import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const initialData = {
  name: "",
  phone: "",
  email: "",
  country: "",
  language: "",
  address: "",
  propertyType: "",
  rooms: "",
  bathrooms: "",
  guests: "",
  airbnbPublished: "",
  airbnbLink: "",
  services: [],
  rules: "",
  comments: "",
  accepted: false,
};

export default function FormWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState({}); // Errores específicos del paso actual

  // Validación individual de campo
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value?.trim()) error = "El nombre es obligatorio";
        break;
      case "email":
        if (!value?.trim()) error = "El email es obligatorio";
        else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value))
          error = "Email inválido";
        break;
      case "phone":
        if (!value?.trim()) error = "El teléfono es obligatorio";
        else if (!/^\+?\d{9,15}$/.test(value.replace(/\s/g, "")))
          error = "Teléfono inválido (9-15 dígitos)";
        break;
      case "address":
        if (!value?.trim()) error = "La dirección es obligatoria";
        break;
      case "rooms":
      case "bathrooms":
      case "guests":
        if (!value || isNaN(value) || Number(value) <= 0)
          error = "Debe ser un número mayor que 0";
        break;
      case "airbnbPublished":
        if (!value) error = "Selecciona sí o no";
        break;
      case "accepted":
        if (!value) error = "Debes aceptar la política de privacidad";
        break;
      default:
        break;
    }

    return error;
  };

  // Validar todos los campos del paso actual
  const validateCurrentStep = () => {
    const fieldsByStep = {
      1: ["name", "email", "phone"],
      2: ["address", "rooms", "bathrooms", "guests", "airbnbPublished"],
      4: ["accepted"],
    };

    const fields = fieldsByStep[step] || [];
    const newErrors = {};

    fields.forEach((field) => {
      const error = validateField(field, data[field]);
      if (error) newErrors[field] = error;
    });

    setStepErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación en tiempo real al cambiar valores
  useEffect(() => {
    const newErrors = {};
    Object.keys(data).forEach((key) => {
      const error = validateField(key, data[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    // También actualizamos errores del paso actual
    validateCurrentStep();
  }, [data, step]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "services") {
        setData((prev) => ({
          ...prev,
          services: checked
            ? [...prev.services, value]
            : prev.services.filter((s) => s !== value),
        }));
      } else {
        setData((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const next = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const back = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!data.accepted) return;

    setIsSubmitting(true);
    try {
      // 1. Insertar cliente
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert([
          {
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email.trim(),
            country: data.country.trim(),
            language: data.language.trim(),
          },
        ])
        .select("id")
        .single();

      if (clientError) throw clientError;
      const clientId = clientData.id;

      // 2. Insertar propiedad
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .insert([
          {
            client_id: clientId,
            address: data.address.trim(),
            property_type: data.propertyType,
            rooms: Number(data.rooms),
            bathrooms: Number(data.bathrooms),
            guests: Number(data.guests),
            airbnb_published: data.airbnbPublished === "yes",
            airbnb_link: data.airbnbLink.trim() || null,
            rules: data.rules.trim(),
            comments: data.comments.trim(),
          },
        ])
        .select("id")
        .single();

      if (propertyError) throw propertyError;
      const propertyId = propertyData.id;

      // 3. Insertar servicios
      if (data.services.length > 0) {
        const servicesToInsert = data.services.map((service) => ({
          property_id: propertyId,
          service_name: service,
        }));

        const { error: servicesError } = await supabase
          .from("services")
          .insert(servicesToInsert);

        if (servicesError) throw servicesError;
      }

      alert("¡Datos enviados correctamente!");
      setData(initialData);
      setStep(1);
      setErrors({});
      setStepErrors({});
    } catch (error) {
      console.error("Error al enviar:", error);
      alert("Ha ocurrido un error al guardar los datos. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasStepErrors = Object.keys(stepErrors).length > 0;

  return (
    <div className="form-container">
      <div className="progress">Paso {step} de 4</div>

      {step === 1 && (
        <>
          <h2>Datos del cliente</h2>
          <input
            name="name"
            placeholder="Nombre completo"
            onChange={handleChange}
            value={data.name}
          />
          {errors.name && <p className="error">{errors.name}</p>}

          <input
            name="phone"
            placeholder="Teléfono (ej: +34612345678)"
            onChange={handleChange}
            value={data.phone}
          />
          {errors.phone && <p className="error">{errors.phone}</p>}

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            value={data.email}
          />
          {errors.email && <p className="error">{errors.email}</p>}

          <input
            name="country"
            placeholder="País / Ciudad"
            onChange={handleChange}
            value={data.country}
          />

          <input
            name="language"
            placeholder="Idioma preferido"
            onChange={handleChange}
            value={data.language}
          />

          <button onClick={next} disabled={hasStepErrors}>
            Siguiente
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Datos de la vivienda</h2>
          <input
            name="address"
            placeholder="Dirección completa"
            onChange={handleChange}
            value={data.address}
          />
          {errors.address && <p className="error">{errors.address}</p>}

          <input
            name="propertyType"
            placeholder="Tipo de vivienda (piso, casa, etc.)"
            onChange={handleChange}
            value={data.propertyType}
          />

          <input
            type="number"
            name="rooms"
            placeholder="Habitaciones"
            onChange={handleChange}
            value={data.rooms}
            min="1"
          />
          {errors.rooms && <p className="error">{errors.rooms}</p>}

          <input
            type="number"
            name="bathrooms"
            placeholder="Baños"
            onChange={handleChange}
            value={data.bathrooms}
            min="1"
          />
          {errors.bathrooms && <p className="error">{errors.bathrooms}</p>}

          <input
            type="number"
            name="guests"
            placeholder="Capacidad máxima de huéspedes"
            onChange={handleChange}
            value={data.guests}
            min="1"
          />
          {errors.guests && <p className="error">{errors.guests}</p>}

          <select name="airbnbPublished" onChange={handleChange} value={data.airbnbPublished}>
            <option value="">¿Publicada en Airbnb?</option>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
          {errors.airbnbPublished && <p className="error">{errors.airbnbPublished}</p>}

          {data.airbnbPublished === "yes" && (
            <input
              name="airbnbLink"
              placeholder="Link del anuncio (opcional)"
              onChange={handleChange}
              value={data.airbnbLink}
            />
          )}

          <div className="buttons">
            <button onClick={back}>Atrás</button>
            <button onClick={next} disabled={hasStepErrors}>
              Siguiente
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2>Servicios y preferencias</h2>
          <div className="checkbox-group">
            {["Atención al cliente", "Gestión completa", "Optimización del anuncio"].map((service) => (
              <label key={service}>
                <input
                  type="checkbox"
                  name="services"
                  value={service}
                  checked={data.services.includes(service)}
                  onChange={handleChange}
                />
                {service}
              </label>
            ))}
          </div>

          <textarea
            name="rules"
            placeholder="Normas importantes de la casa"
            onChange={handleChange}
            value={data.rules}
          />

          <textarea
            name="comments"
            placeholder="Comentarios adicionales"
            onChange={handleChange}
            value={data.comments}
          />

          <div className="buttons">
            <button onClick={back}>Atrás</button>
            <button onClick={next}>Siguiente</button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h2>Confirmación</h2>
          <p>Revisa que todos los datos sean correctos antes de enviar.</p>

          <label>
            <input
              type="checkbox"
              name="accepted"
              checked={data.accepted}
              onChange={handleChange}
            />
            Acepto la{" "}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer">
              política de privacidad
            </a>
          </label>
          {errors.accepted && <p className="error">{errors.accepted}</p>}

          <div className="buttons">
            <button onClick={back}>Atrás</button>
            <button onClick={handleSubmit} disabled={!data.accepted || isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar información"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}