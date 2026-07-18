const PDFDocument = require('pdfkit')
const fs = require('fs')

const doc = new PDFDocument({ margin: 50, size: 'A4' })
const stream = fs.createWriteStream('preguntas-proyecto.pdf')
doc.pipe(stream)

const questions = [
  {
    section: 'Autenticación y Seguridad',
    items: [
      '¿Querés login con email y contraseña, o con Google/Apple?',
      '¿Cuántos usuarios van a usar la app simultáneamente?',
      '¿Necesitás distintos roles (dueño, empleado, admin)?',
      '¿Querés que los clientes tengan acceso a algo (portal cliente)?',
    ]
  },
  {
    section: 'Base de Datos',
    items: [
      '¿Ya tenés Supabase creado o lo creamos desde cero?',
      '¿Los datos actuales (localStorage) se migran o arrancamos limpio?',
      '¿Querés que los datos se guarden en la nube (Supabase) o seguimos con localStorage?',
      '¿Necesitás backup automático de los datos?',
    ]
  },
  {
    section: 'Funcionalidades Nuevas',
    items: [
      '¿Querés notificaciones push cuando cambia el estado de una orden?',
      '¿Necesitás que el cliente reciba WhatsApp al estar listo el auto?',
      '¿Querés envío de facturas por email o WhatsApp?',
      '¿Necesitás control de stock de repuestos/repuestos usados?',
      '¿Querés agenda de turnos para que el cliente reserve horarios?',
      '¿Necesitás photos antes/después del servicio (ya parcialmente implementado)?',
      '¿Querés seguimiento de garantías de trabajos realizados?',
      '¿Necesitás recordatorios de service por kilometraje o tiempo?',
    ]
  },
  {
    section: 'Reportes y Finanzas',
    items: [
      '¿Qué reportes necesitás además de los actuales (ingresos, servicios, estados)?',
      '¿Querés exportar datos a Excel/CSV?',
      '¿Necesitás liquidación de IVA o impuestos?',
      '¿Querés comparativa de períodos (mes vs mes, año vs año)?',
      '¿Necesitás control de caja diaria (ingresos/egresos del día)?',
    ]
  },
  {
    section: 'WhatsApp Business',
    items: [
      '¿Ya tenés cuenta de WhatsApp Business API o la creamos?',
      '¿Querés mensajes automáticos (bienvenida, estado, facturas)?',
      '¿Querés que el cliente pueda enviar fotos del problema por WhatsApp?',
      '¿Necesitás mensajería masiva (promociones, recordatorios)?',
    ]
  },
  {
    section: 'Experiencia de Usuario',
    items: [
      '¿La app es solo para uso interno del taller o también la ven los clientes?',
      '¿Necesitás modo offline para zonas sin internet?',
      '¿Querés tema claro además del oscuro, o solo oscuro?',
      '¿Necesitás que funcione bien en tablets también?',
      '¿Querés que se pueda usar desde la PC (escritorio) y el celular?',
    ]
  },
  {
    section: 'Integraciones',
    items: [
      '¿Necesitás integración con Mercado Pago u otro cobro online?',
      '¿Querés conexión con Google Calendar para turnos?',
      '¿Necesitás conexión con tu sistema contable actual?',
      '¿Querés API para conectarte con otras apps en el futuro?',
    ]
  },
  {
    section: 'Deploy y Mantenimiento',
    items: [
      '¿Querés dominio propio (ej: taller-damian.com.ar)?',
      '¿Necesitás soporte técnico post-entrega?',
      '¿Querés que actualice la app con nuevas funcionalidades periódicamente?',
      '¿Tenés presupuesto definido para el próximo sprint?',
    ]
  },
]

const colors = {
  black: '#000000',
  gray: '#666666',
  lightGray: '#999999',
  accent: '#2563eb',
}

doc.fontSize(24).font('Helvetica-Bold').fillColor(colors.black)
doc.text('Taller Mecánico', { align: 'center' })
doc.moveDown(0.3)
doc.fontSize(11).font('Helvetica').fillColor(colors.lightGray)
doc.text('Preguntas para Próximo Sprint', { align: 'center' })
doc.moveDown(0.3)
doc.fontSize(9).fillColor(colors.lightGray)
doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' })
doc.moveDown(1.5)

doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e5e5').stroke()
doc.moveDown(0.8)

questions.forEach((q, qi) => {
  doc.fontSize(13).font('Helvetica-Bold').fillColor(colors.accent)
  doc.text(`${qi + 1}. ${q.section}`)
  doc.moveDown(0.4)

  q.items.forEach((item, ii) => {
    const y = doc.y
    doc.fontSize(10).font('Helvetica').fillColor(colors.gray)
    doc.text(`☐  ${item}`, 65, y, { width: 460 })
    doc.moveDown(0.5)
  })

  doc.moveDown(0.5)
  if (qi < questions.length - 1) {
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#f0f0f0').stroke()
    doc.moveDown(0.6)
  }
})

doc.moveDown(1)
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e5e5').stroke()
doc.moveDown(0.8)

doc.fontSize(9).font('Helvetica').fillColor(colors.lightGray)
doc.text('Documento generado para el proyecto Taller Mecánico — React + Supabase + Vercel', { align: 'center' })

doc.end()

stream.on('finish', () => {
  console.log('PDF generado: preguntas-proyecto.pdf')
})
