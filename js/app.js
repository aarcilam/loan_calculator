const { createApp } = Vue;

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
  template: `
    <div class="loan-calculator" style="max-width:400px; padding:1rem; border:1px solid #ddd; border-radius:8px;">
      <h3>Calculadora de Préstamos</h3>
      <label>Monto: 
        <input type="number" v-model="amount" />
      </label><br><br>
      
      <label>Tasa de interés (%): 
        <input type="number" v-model="rate" step="0.1"/>
      </label><br><br>
      
      <label>Años: 
        <input type="number" v-model="years" />
      </label><br><br>
      
      <h4>Pago mensual: ${{ monthlyPayment }}</h4>
    </div>
  `,
}).mount("#loan-calculator");