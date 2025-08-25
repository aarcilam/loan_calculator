document.addEventListener('DOMContentLoaded', function() {
  const { createApp, h } = Vue;

  createApp({
    data() {
      return {
        amount: 10000,
        rate: 5,
        years: 1,
      };
    },
    computed: {
      monthlyPayment() {
        const principal = this.amount;
        const monthlyRate = this.rate / 100 / 12;
        const numberOfPayments = this.years * 12;

        if (monthlyRate === 0) {
          return (principal / numberOfPayments).toFixed(2);
        }

        const payment =
          (principal * monthlyRate) /
          (1 - Math.pow(1 + monthlyRate, -numberOfPayments));

        return payment.toFixed(2);
      },
    },
    render() {
      return h('div', {
        class: 'loan-calculator',
        style: 'max-width:400px; padding:1rem; border:1px solid #ddd; border-radius:8px;'
      }, [
        h('h3', 'Calculadora de Préstamos'),
        h('label', [
          'Monto: ',
          h('input', {
            type: 'number',
            value: this.amount,
            onInput: (e) => this.amount = parseFloat(e.target.value) || 0
          })
        ]),
        h('br'),
        h('br'),
        h('label', [
          'Tasa de interés (%): ',
          h('input', {
            type: 'number',
            step: '0.1',
            value: this.rate,
            onInput: (e) => this.rate = parseFloat(e.target.value) || 0
          })
        ]),
        h('br'),
        h('br'),
        h('label', [
          'Años: ',
          h('input', {
            type: 'number',
            value: this.years,
            onInput: (e) => this.years = parseFloat(e.target.value) || 0
          })
        ]),
        h('br'),
        h('br'),
        h('h4', `Pago mensual: $${this.monthlyPayment}`)
      ]);
    }
  }).mount("#loan-calculator");
});