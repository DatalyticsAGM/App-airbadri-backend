# 🎯 Milestone 6: Pantalla de Checkout

## 📋 Descripción
Crear la ruta `/checkout` con los detalles básicos para completar una reserva. La pantalla mostrará un resumen de la propiedad, fechas, huéspedes, información del usuario y el desglose de precios. Todo basado en MOCKS y manteniendo el estilo visual consistente con el resto de la aplicación.

## ✅ To-Do List

- [ ] **1** Crear estructura base y tipos para checkout
  - [ ] Archivo: `lib/checkout/types.ts` - Interfaces `CheckoutData`, `PricingBreakdown`, `CheckoutFormData`
  - [ ] Archivo: `lib/checkout/mock-checkout.ts` - Funciones `getCheckoutData()`, `calculatePricing()`, `validateCheckoutData()`
  - [ ] Archivo: `app/checkout/page.tsx` - Página base con Header/Footer, verificación de autenticación, layout responsive
  - [ ] Comentarios explicativos en funciones esenciales sobre qué hacen y por qué existen

- [ ] **2** Crear componentes de resumen visual
  - [ ] Archivo: `components/checkout/property-summary.tsx` - Muestra imagen, título, ubicación, fechas, huéspedes y noches
  - [ ] Archivo: `components/checkout/pricing-breakdown.tsx` - Muestra desglose de precios (noche × noches, servicios 10%, total)
  - [ ] Usar clases Tailwind consistentes (airbnb-primary-100, airbnb-text-100, rounded-2xl, shadow-lg)
  - [ ] Diseño tipo card con bordes redondeados y formato de moneda en euros

- [ ] **3** Crear componente de información del usuario
  - [ ] Archivo: `components/checkout/user-info-section.tsx` - Formulario con nombre, email y teléfono (opcional)
  - [ ] Obtener datos del usuario desde `useAuth` y pre-llenar formulario
  - [ ] Validación básica de campos (email y nombre requeridos)
  - [ ] Usar componentes UI existentes (Input, Label) con diseño consistente

- [ ] **4** Implementar página de checkout completa con integración
  - [ ] Obtener datos desde query params (propertyId, checkIn, checkOut, guests)
  - [ ] Cargar datos usando servicio MOCK y mostrar todos los componentes
  - [ ] Layout de dos columnas en desktop (resumen a la derecha), una columna en mobile
  - [ ] Botón "Confirmar Reserva" destacado con estado de carga

- [ ] **5** Implementar lógica de confirmación y asegurar consistencia visual
  - [ ] Función `handleConfirmBooking()` que valida datos, llama a `mockBookings.createBooking()` y redirige a detalle de reserva
  - [ ] Manejo de errores con mensajes user-friendly
  - [ ] Revisar y ajustar colores, espaciado, tipografía y responsive design para consistencia
  - [ ] Agregar botón "Volver" o enlace a detalle de propiedad

## 📊 Estado General
- **Total de tareas**: 5
- **Completadas**: 0
- **En progreso**: 0
- **Pendientes**: 5

## 🎯 Objetivo
Tener una pantalla de checkout funcional que permita a los usuarios:
- Ver resumen completo de su reserva (propiedad, fechas, huéspedes)
- Ver desglose detallado de precios
- Revisar y editar su información personal
- Confirmar la reserva de forma sencilla
- Mantener consistencia visual con el resto de la aplicación

## 📝 Notas
- Mantener la implementación simple y directa
- Usar datos MOCK almacenados en localStorage
- No usar tipos avanzados de TypeScript
- Comentar funciones esenciales explicando qué hacen y por qué existen
- Asumir que será implementado por un desarrollador junior
- Priorizar claridad sobre velocidad
- Cada tarea debe ser independientemente completable

## 🔗 Dependencias
Este milestone requiere que los Milestones 1 y 2 estén completados, específicamente:
- Sistema de autenticación funcional (`useAuth`)
- Servicio MOCK de propiedades (`mockProperties`)
- Servicio MOCK de reservas (`mockBookings`)
- Tipos de Booking y Property definidos

## 📝 Archivos a Crear/Modificar

### Nuevos Archivos:
1. `lib/checkout/types.ts` - Tipos TypeScript para checkout
2. `lib/checkout/mock-checkout.ts` - Servicio MOCK de checkout
3. `components/checkout/property-summary.tsx` - Resumen de propiedad
4. `components/checkout/pricing-breakdown.tsx` - Desglose de precios
5. `components/checkout/user-info-section.tsx` - Información del usuario
6. `components/checkout/index.ts` - Barrel export
7. `app/checkout/page.tsx` - Página de checkout

### Archivos a Modificar:
1. `components/header.tsx` - Agregar enlace a checkout si es necesario (opcional)

## ✅ Criterios de Aceptación
- [ ] La ruta `/checkout` es accesible y muestra la página correctamente
- [ ] Los usuarios no autenticados son redirigidos al login
- [ ] Se muestra el resumen completo de la propiedad con imagen, título y ubicación
- [ ] Se muestran correctamente las fechas de check-in y check-out
- [ ] Se muestra el número de huéspedes y noches
- [ ] El desglose de precios es correcto (subtotal, servicios, total)
- [ ] La información del usuario se pre-llena y puede editarse
- [ ] El botón de confirmar reserva funciona correctamente
- [ ] Después de confirmar, se redirige a la página de detalle de reserva
- [ ] El diseño es responsive y consistente con otras páginas
- [ ] No hay errores de TypeScript
- [ ] Los datos se manejan correctamente con MOCKS

---
**Estado**: ⏳ PENDIENTE
**Última actualización**: 2024-12-19

