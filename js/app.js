document.addEventListener('DOMContentLoaded', function () {
  const { createApp, h } = Vue;

  createApp({
    data() {
      return {
        // Tipo de simulación
        tipoSimulacion: 'monto-a-cuota', // 'monto-a-cuota' o 'cuota-a-monto'

        // Estados de visibilidad
        detalleCostosVisible: false,
        tablaAmortizacionVisible: false,

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
        montoMax: 50000000,
        cuotaMin: 50000,
        cuotaMax: 1000000,
        plazoMin: 12,
        plazoMax: 180
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
      crearSlider(label, model, min, max, onChange, formatear = true) {
        return h('div', { style: 'margin-bottom:1.5rem;' }, [
          h('label', { style: 'display:block; margin-bottom:0.5rem; color:#555; font-weight:bold;' }, label),
          h('div', { style: 'display:flex; align-items:center; gap:1rem;' }, [
            h('span', { style: 'color:#666; font-size:0.9rem; min-width:80px;' },
              formatear ? this.formatearMoneda(min) : `${min}`
            ),
            h('input', {
              type: 'range',
              min: min,
              max: max,
              value: this[model],
              onInput: (e) => onChange(parseInt(e.target.value)),
              style: 'flex:1; height:6px; background:#ddd; border-radius:3px; outline:none;'
            }),
            h('input', {
              type: 'number',
              value: this[model],
              onInput: (e) => onChange(parseInt(e.target.value)),
              style: 'width:150px; padding:0.5rem; border:1px solid #ddd; border-radius:4px; text-align:center; font-size:1rem;'
            }),
            h('span', { style: 'color:#666; font-size:0.9rem; min-width:80px;' },
              formatear ? this.formatearMoneda(max) : `${max}`
            )
          ])
        ]);
      },
      crearResultado(label, valor, destacado = false) {
        return h('div', {
          style: `display:flex; justify-content:space-between; align-items:center; padding:1rem; margin-bottom:0.5rem; border-radius:6px; ${destacado ? 'background:#e8f4f8; border:2px solid #528A93;' : 'background:#f0f4f8;'}`
        }, [
          h('span', { style: `font-weight:bold; ${destacado ? 'color:#24334B;' : 'color:#24334B;'}` }, label),
          h('span', { style: `font-weight:bold; ${destacado ? 'color:#24334B;' : 'color:#24334B;'}` },
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
        class: 'simulador-credito',
        style: 'width:100%; margin:0 auto; padding:2rem; background:#f5f7fa; border-radius:12px; font-family:Arial,sans-serif;'
      }, [
        // Header
        h('h1', {
          style: 'color:#24334B; text-align:center; margin-bottom:0.5rem; font-size:2.5rem;'
        }, 'Simulador de Crédito'),
        h('p', {
          style: 'text-align:center; color:#666; margin-bottom:2rem; font-size:1.1rem;'
        }, 'Simule monto a cuota o cuota a monto en tiempo real'),

        // Selector de tipo de simulación
        h('div', { style: 'background:white; padding:1.5rem; border-radius:8px; margin-bottom:1.5rem; text-align:center;' }, [
          h('h3', { style: 'color:#333; margin-bottom:1rem;' }, 'Tipo de Simulación:'),
          h('div', { style: 'display:flex; gap:1rem; justify-content:center;' }, [
            h('button', {
              onClick: () => this.cambiarSimulacion('monto-a-cuota'),
              style: `padding:0.75rem 1.5rem; border:none; border-radius:6px; font-size:1rem; font-weight:bold; cursor:pointer; ${this.tipoSimulacion === 'monto-a-cuota' ? 'background:#528A93; color:white;' : 'background:#e9ecef; color:#495057;'}`
            }, 'MONTO A CUOTA'),
            h('button', {
              onClick: () => this.cambiarSimulacion('cuota-a-monto'),
              style: `padding:0.75rem 1.5rem; border:none; border-radius:6px; font-size:1rem; font-weight:bold; cursor:pointer; ${this.tipoSimulacion === 'cuota-a-monto' ? 'background:#528A93; color:white;' : 'background:#e9ecef; color:#495057;'}`
            }, 'CUOTA A MONTO')
          ])
        ]),

        // Parámetros de entrada
        h('div', { style: 'background:white; padding:1.5rem; border-radius:8px; margin-bottom:1.5rem;' }, [
          h('h3', { style: 'color:#333; margin-bottom:1rem;' }, 'Parámetros de Entrada:'),

          this.tipoSimulacion === 'monto-a-cuota'
            ? this.crearSlider('Monto Desembolso *', 'montoDesembolso', this.montoMin, this.montoMax, this.actualizarMonto.bind(this))
            : this.crearSlider('Cuota *', 'cuota', this.cuotaMin, this.cuotaMax, this.actualizarCuota.bind(this)),

          this.crearSlider('Plazo (meses) *', 'plazoMeses', this.plazoMin, this.plazoMax, this.actualizarPlazo.bind(this), false)
        ]),

        // Resultados principales
        h('div', { style: 'background:white; padding:1.5rem; border-radius:8px; margin-bottom:1.5rem;' }, [
          h('h3', { style: 'color:#333; margin-bottom:1rem;' }, 'Resultados de la Simulación:'),

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

        // Detalle de costos
        h('div', { style: 'background:white; padding:1.5rem; border-radius:8px; margin-bottom:1.5rem;' }, [
          h('div', {
            style: 'display:flex; justify-content:space-between; align-items:center; cursor:pointer;',
            onClick: () => this.alternarDetalleCostos()
          }, [
            h('h3', { style: 'color:#333; margin:0;' }, 'Detalle de Costos:'),
            h('span', {
              style: 'font-size:1.5rem; color:#666; transition:transform 0.3s;',
              class: this.detalleCostosVisible ? 'rotated' : ''
            }, this.detalleCostosVisible ? '-' : '+')
          ]),

          // Contenido del acordeón
          h('div', {
            style: `overflow:hidden; transition:all 0.3s ease; ${this.detalleCostosVisible ? 'max-height:1000px; opacity:1;' : 'max-height:0; opacity:0;'}`
          }, [
            h('div', { style: 'display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1rem;' }, [
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
        ]),

        // Tabla de Amortización (solo visible en cuota a monto)
        this.tipoSimulacion === 'cuota-a-monto' ? h('div', { style: 'background:white; padding:1.5rem; border-radius:8px;' }, [
          h('div', {
            style: 'display:flex; justify-content:space-between; align-items:center; cursor:pointer;',
            onClick: () => this.alternarTablaAmortizacion()
          }, [
            h('h3', { style: 'color:#333; margin:0;' }, 'Tabla de Amortización:'),
            h('span', {
              style: 'font-size:1.5rem; color:#666; transition:transform 0.3s;',
              class: this.tablaAmortizacionVisible ? 'rotated' : ''
            }, this.tablaAmortizacionVisible ? '-' : '+')
          ]),

          // Contenido del acordeón
          h('div', {
            style: `overflow:hidden; transition:all 0.3s ease; ${this.tablaAmortizacionVisible ? 'max-height:2000px; opacity:1;' : 'max-height:0; opacity:0;'}`
          }, [
            h('div', { style: 'overflow-x:auto; margin-top:1rem;' }, [
              h('table', {
                style: 'width:100%; border-collapse:collapse; border:1px solid #ddd; font-size:0.9rem;'
              }, [
                // Encabezados de la tabla
                h('thead', [
                  h('tr', { style: 'background:#e8f4f8;' }, [
                                      h('th', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:center; font-weight:bold; color:#24334B;' }, 'ITEM'),
                  h('th', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:center; font-weight:bold; color:#24334B;' }, 'CUOTA'),
                  h('th', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:center; font-weight:bold; color:#24334B;' }, 'INTERES'),
                  h('th', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:center; font-weight:bold; color:#24334B;' }, 'CAPITAL'),
                  h('th', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:center; font-weight:bold; color:#24334B;' }, 'SEGURO DE VIDA'),
                  h('th', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:bold; color:#24334B;' }, 'APORTE'),
                  h('th', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:center; font-weight:bold; color:#24334B;' }, 'SALDO')
                  ])
                ]),
                // Cuerpo de la tabla
                h('tbody', this.generarFilasAmortizacion().map(fila => 
                  h('tr', { style: 'border-bottom:1px solid #eee;' }, [
                    h('td', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:center; font-weight:bold; color:#666;' }, fila.item),
                                      h('td', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:right; color:#528A93; font-weight:bold;' }, this.formatearMoneda(fila.cuota)),
                  h('td', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:right; color:#24334B;' }, this.formatearMoneda(fila.interes)),
                  h('td', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:right; color:#528A93;' }, this.formatearMoneda(fila.capital)),
                  h('td', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:right; color:#24334B;' }, this.formatearMoneda(fila.seguroVida)),
                  h('td', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:right; color:#528A93;' }, this.formatearMoneda(fila.aporte)),
                  h('td', { style: 'padding:0.75rem; border:1px solid #ddd; text-align:right; color:#24334B; font-weight:bold;' }, this.formatearMoneda(fila.saldo))
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