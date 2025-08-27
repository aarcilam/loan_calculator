document.addEventListener('DOMContentLoaded', function () {
  const { createApp, h } = Vue;

  // Obtener la variable del shortcode desde el DOM
  const shortcodeElement = document.getElementById('loan-calculator');
  const mostrarDetalles = shortcodeElement ? shortcodeElement.getAttribute('data-mostrar-detalles') !== 'false' : true;

  createApp({
    data() {
      return {
        // Tipo de simulación
        tipoSimulacion: 'monto-a-cuota', // 'monto-a-cuota' o 'cuota-a-monto'

        // Estados de visibilidad
        detalleCostosVisible: false,
        tablaAmortizacionVisible: false,
        mostrarDetalles: mostrarDetalles, // Nueva variable para controlar la visibilidad

        // Valores de entrada (modificables por el cliente)
        montoDesembolso: 10000000,
        cuota: 262641,
        plazoMeses: 144,

        // Valores fijos (parte de la fórmula)
        tasa: 1.66,
        seguroVida: 1500,
        afiliacion: 200000,
        aporte: 20000,
        fianza: 7.0,
        corretaje: 6.0,
        interesesAnticipados: 3.6,
        impuesto4x1000: 0.4,

        // Límites
        montoMin: 1000000,
        montoMax: 80000000,
        cuotaMin: 50000,
        cuotaMax: 1000000,
        plazoMin: 12,
        plazoMax: 144
      };
    },
    computed: {
      // Valores comunes
      totalCostosAlFrente() {
        return this.fianza + this.corretaje + this.interesesAnticipados + this.impuesto4x1000;
      },

      // Cálculos para MONTO A CUOTA
      montoTotal() {
        if (this.tipoSimulacion === 'monto-a-cuota') {
          const montoDesembolso = this.montoDesembolso;
          const costosAlFrente = this.totalCostosAlFrente;
          const afiliacion = this.afiliacion;

          if (costosAlFrente >= 100) return 0;

          return (montoDesembolso * 1.0) / (1 - (costosAlFrente / 100)) + afiliacion;
        }
        return 0;
      },
      cuotaCalculada() {
        if (this.tipoSimulacion === 'monto-a-cuota') {
          const tasa = this.tasa;
          const plazo = this.plazoMeses;
          const montoTotal = this.montoTotal;
          const seguroVida = this.seguroVida;
          const aporte = this.aporte;

          const tasaMensual = tasa / 100;

          const pmt = this.pmt(tasaMensual, plazo, -montoTotal);
          const seguroProporcional = (seguroVida * montoTotal) / 1000000;

          return Math.round(pmt + seguroProporcional + aporte);
        }
        return 0;
      },

      // Cálculos para CUOTA A MONTO
      factorPorMillon() {
        const tasaMensual = this.tasa / 100;
        const plazo = this.plazoMeses;

        if (tasaMensual === 0) return 0;

        const cuotaMillon = (this.pmt(tasaMensual, plazo, -1000000))+this.seguroVida;
        return Math.round(cuotaMillon);
      },
      montoTotalCalculado() {
        if (this.tipoSimulacion === 'cuota-a-monto') {
          const factor = this.factorPorMillon;
          const cuota = this.cuota;
          const seguroVida = this.seguroVida;
          const aporte = this.aporte;

          if (factor === 0) return 0;

          // Calculamos el monto total basado en la cuota neta (sin seguro ni aporte)
          const cuotaNeto = (cuota/factor)*1000000;
          return Math.round(cuotaNeto);
        }
        return 0;
      },
      montoDesembolsable() {
        if (this.tipoSimulacion === 'cuota-a-monto') {
          const montoTotal = this.montoTotalCalculado;
          const costosAlFrente = this.totalCostosAlFrente;

          if (costosAlFrente >= 100) return 0;

          return Math.round((montoTotal * (100 - costosAlFrente) / 100) - this.afiliacion);
        }
        return 0;
      }
    },
    methods: {
      pmt(rate, nperiod, pv, fv = 0, type = 0) {
        if (rate == 0) return -(pv + fv) / nperiod;

        const pvif = Math.pow(1 + rate, nperiod);
        const pmt = rate / (pvif - 1) * -(pv * pvif + fv);

        if (type == 1) {
          pmt /= (1 + rate);
        }

        return pmt;
      },

      cambiarSimulacion(tipo) {
        this.tipoSimulacion = tipo;
        // Resetear valores según el tipo
        if (tipo === 'monto-a-cuota') {
          this.montoDesembolso = 10000000;
          this.tablaAmortizacionVisible = false;
        } else {
          this.cuota = 262641;
          this.tablaAmortizacionVisible = false;
        }
        this.plazoMeses = 144;
      },
      alternarDetalleCostos() {
        this.detalleCostosVisible = !this.detalleCostosVisible;
      },
      alternarTablaAmortizacion() {
        this.tablaAmortizacionVisible = !this.tablaAmortizacionVisible;
      },
      actualizarMonto(valor) {
        this.montoDesembolso = Math.max(this.montoMin, Math.min(this.montoMax, parseInt(valor) || 0));
      },
      actualizarCuota(valor) {
        this.cuota = Math.max(this.cuotaMin, Math.min(this.cuotaMax, parseInt(valor) || 0));
      },
      actualizarPlazo(valor) {
        this.plazoMeses = Math.max(this.plazoMin, Math.min(this.plazoMax, parseInt(valor) || 0));
      },
      formatearMoneda(valor) {
        const numValor = parseFloat(valor);
        if (isNaN(numValor)) return '$0';

        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(numValor);
      },
      limpiarFormatoMoneda(valor) {
        // Remover símbolo de peso, comas, puntos y espacios
        return valor.replace(/[$,.\s]/g, '');
      },
      aplicarMascaraMoneda(valor) {
        // Aplicar formato de moneda colombiana
        const numero = parseInt(valor);
        if (isNaN(numero)) return '$0';
        
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(numero);
      },
      crearSlider(label, model, min, max, onChange, formatear = true) {
        return h('div', { class: 'slider-container' }, [
          h('label', { class: 'slider-label' }, label),
          h('div', { class: 'slider-controls' }, [
            h('span', { class: 'slider-min' },
              formatear ? this.formatearMoneda(min) : `${min}`
            ),
            h('input', {
              type: 'range',
              min: min,
              max: max,
              value: this[model],
              onInput: (e) => onChange(parseInt(e.target.value))
            }),
            h('input', {
              type: 'text',
              value: formatear ? this.formatearMoneda(this[model]) : this[model],
              onInput: (e) => {
                let valor = e.target.value;
                
                if (formatear) {
                  // Para campos de moneda: permitir solo números
                  valor = valor.replace(/[^\d]/g, '');
                  
                  if (valor.length > 0) {
                    const numero = parseInt(valor);
                    if (!isNaN(numero)) {
                      // Aplicar formato en tiempo real
                      e.target.value = this.aplicarMascaraMoneda(numero);
                      onChange(numero);
                    }
                  }
                } else {
                  // Para campos numéricos: permitir solo números
                  valor = valor.replace(/[^\d]/g, '');
                  onChange(parseInt(valor) || 0);
                }
              },
              onFocus: (e) => {
                if (formatear) {
                  // Mostrar solo el número sin formato al hacer focus
                  e.target.value = this[model];
                  e.target.select();
                }
              },
              onBlur: (e) => {
                if (formatear) {
                  // Al perder el focus, limpiar y aplicar formato final
                  const valorLimpio = this.limpiarFormatoMoneda(e.target.value);
                  const numero = parseInt(valorLimpio) || 0;
                  
                  // Aplicar límites min/max
                  const valorFinal = Math.max(min, Math.min(max, numero));
                  
                  // Aplicar formato final
                  e.target.value = this.aplicarMascaraMoneda(valorFinal);
                  onChange(valorFinal);
                }
              },
              placeholder: formatear ? '$0' : '0'
            }),
            h('span', { class: 'slider-max' },
              formatear ? this.formatearMoneda(max) : `${max}`
            )
          ])
        ]);
      },
      crearResultado(label, valor, destacado = false) {
        return h('div', {
          class: `resultado ${destacado ? 'destacado' : ''}`
        }, [
          h('span', { class: 'label' }, label),
          h('span', { class: 'valor' },
            typeof valor === 'number' ? this.formatearMoneda(valor) : valor
          )
        ]);
      },
      generarFilasAmortizacion() {
        let montoTotal, cuota, seguroVida;
        
        if (this.tipoSimulacion === 'monto-a-cuota') {
          montoTotal = this.montoTotal;
          cuota = this.cuotaCalculada;
        } else {
          montoTotal = this.montoTotalCalculado;
          cuota = this.cuota;
        }
        
        // Log de depuración
        console.log('Tipo simulación:', this.tipoSimulacion);
        console.log('Monto total:', montoTotal);
        console.log('Cuota:', cuota);
        console.log('Factor por millón:', this.factorPorMillon);
        
        const tasaMensual = this.tasa / 100;
        const plazo = this.plazoMeses;
        seguroVida = +this.seguroVida * montoTotal / 1000000;
        const aporte = 0;

        let saldo = montoTotal;
        const filas = [];

        for (let i = 0; i <= plazo; i++) {
          let interes = 0;
          if (saldo>0.9 && i>0) {
            interes = Math.round(saldo * tasaMensual);
          }
          const capital = Math.round(cuota - interes - seguroVida - aporte);
          const saldoAnterior = saldo;
          if (i>0) {
            saldo = Math.round(saldoAnterior - capital);
          }

          if (i>0) {
            filas.push({
              item: i,
              cuota: cuota,
              interes: interes,
              capital: capital,
              seguroVida: seguroVida,
              aporte: aporte,
              saldo: saldo
            });
          }else{
            filas.push({
              item: i,
              cuota: 0,
              interes: 0,
              capital: 0,
              seguroVida: 0,
              aporte: 0,
              saldo: saldo
            });
          }
        }
        return filas;
      }
    },
    render() {
      return h('div', {
        class: 'simulador-credito'
      }, [
        // Header
        h('h1', {}, 'Simulador de Crédito'),
        h('p', {}, 'Simule monto a cuota o cuota a monto en tiempo real'),

        // Selector de tipo de simulación
        h('div', { class: 'tipo-simulacion' }, [
          h('h3', {}, 'Tipo de Simulación:'),
          h('div', { class: 'botones' }, [
            h('button', {
              onClick: () => this.cambiarSimulacion('monto-a-cuota'),
              class: this.tipoSimulacion === 'monto-a-cuota' ? 'activo' : ''
            }, 'MONTO A CUOTA'),
            h('button', {
              onClick: () => this.cambiarSimulacion('cuota-a-monto'),
              class: this.tipoSimulacion === 'cuota-a-monto' ? 'activo' : ''
            }, 'CUOTA A MONTO')
          ])
        ]),

        // Parámetros de entrada
        h('div', { class: 'parametros' }, [
          h('h3', {}, 'Parámetros de Entrada:'),

          this.tipoSimulacion === 'monto-a-cuota'
            ? this.crearSlider('Monto Desembolso *', 'montoDesembolso', this.montoMin, this.montoMax, this.actualizarMonto.bind(this))
            : this.crearSlider('Cuota *', 'cuota', this.cuotaMin, this.cuotaMax, this.actualizarCuota.bind(this)),

          this.crearSlider('Plazo (meses) *', 'plazoMeses', this.plazoMin, this.plazoMax, this.actualizarPlazo.bind(this), false)
        ]),

        // Resultados principales
        h('div', { class: 'resultados' }, [
          h('h3', {}, 'Resultados de la Simulación:'),

          this.tipoSimulacion === 'monto-a-cuota'
            ? [
              this.crearResultado('Monto Total', this.montoTotal, true),
              this.crearResultado('Cuota Calculada', this.cuotaCalculada, true)
            ]
            : [
              // this.crearResultado('Factor por Millón', this.factorPorMillon, true),
              this.crearResultado('Monto Total', this.montoTotalCalculado, true),
              this.crearResultado('Monto Desembolsable', this.montoDesembolsable, true)
            ]
        ]),

        // Detalle de costos (solo visible si mostrarDetalles es true)
        this.mostrarDetalles ? h('div', { class: 'acordeon' }, [
          h('div', {
            class: 'acordeon-header',
            onClick: () => this.alternarDetalleCostos()
          }, [
            h('h3', {}, 'Detalle de Costos:'),
            h('span', {
              class: `acordeon-toggle ${this.detalleCostosVisible ? 'rotated' : ''}`
            }, this.detalleCostosVisible ? '-' : '+')
          ]),

          // Contenido del acordeón
          h('div', {
            class: `acordeon-content ${this.detalleCostosVisible ? 'expanded' : 'collapsed'}`
          }, [
            h('div', { class: 'detalles-grid' }, [
              h('div', [
                this.crearResultado('Tasa de Interés', `${this.tasa}%`),
                this.crearResultado('Seguro de Vida', this.formatearMoneda(this.seguroVida)),
                this.crearResultado('Afiliación', this.formatearMoneda(this.afiliacion)),
                this.crearResultado('Aporte', this.formatearMoneda(this.aporte))
              ]),
              h('div', [
                this.crearResultado('Fianza', `${this.fianza}%`),
                this.crearResultado('Corretaje', `${this.corretaje}%`),
                this.crearResultado('Intereses Anticipados', `${this.interesesAnticipados}%`),
                this.crearResultado('4x1000', `${this.impuesto4x1000}%`)
              ])
            ]),

            this.crearResultado('Total Costos al Frente', `${this.totalCostosAlFrente}%`)
          ])
        ]) : null,

        // Tabla de Amortización (solo visible en cuota a monto Y si mostrarDetalles es true)
        (this.tipoSimulacion === 'cuota-a-monto' && this.mostrarDetalles) ? h('div', { class: 'acordeon' }, [
          h('div', {
            class: 'acordeon-header',
            onClick: () => this.alternarTablaAmortizacion()
          }, [
            h('h3', {}, 'Tabla de Amortización:'),
            h('span', {
              class: `acordeon-toggle ${this.tablaAmortizacionVisible ? 'rotated' : ''}`
            }, this.tablaAmortizacionVisible ? '-' : '+')
          ]),

          // Contenido del acordeón
          h('div', {
            class: `acordeon-content ${this.tablaAmortizacionVisible ? 'expanded' : 'collapsed'}`
          }, [
            h('div', { class: 'tabla-container' }, [
                            h('table', {}, [
                // Encabezados de la tabla
                h('thead', [
                  h('tr', {}, [
                    h('th', {}, 'ITEM'),
                    h('th', {}, 'CUOTA'),
                    h('th', {}, 'INTERES'),
                    h('th', {}, 'CAPITAL'),
                    h('th', {}, 'SEGURO DE VIDA'),
                    h('th', {}, 'APORTE'),
                    h('th', {}, 'SALDO')
                  ])
                ]),
                                // Cuerpo de la tabla
                h('tbody', this.generarFilasAmortizacion().map(fila => 
                  h('tr', {}, [
                    h('td', {}, fila.item),
                    h('td', { class: 'cuota' }, this.formatearMoneda(fila.cuota)),
                    h('td', { class: 'interes' }, this.formatearMoneda(fila.interes)),
                    h('td', { class: 'capital' }, this.formatearMoneda(fila.capital)),
                    h('td', { class: 'seguro' }, this.formatearMoneda(fila.seguroVida)),
                    h('td', { class: 'aporte' }, this.formatearMoneda(fila.aporte)),
                    h('td', { class: 'saldo' }, this.formatearMoneda(fila.saldo))
                  ])
                ))
              ])
            ])
          ])
        ]) : null
      ]);
    }
  }).mount("#loan-calculator");
});