<?php
/**
 * Plugin Name: Simulador de Crédito
 * Description: Shortcode para mostrar un simulador de crédito con opciones configurables
 * Version: 1.0
 * Author: Tu Nombre
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue de scripts y estilos
function enqueue_loan_calculator_assets() {
    wp_enqueue_script('vue-js', 'https://unpkg.com/vue@3/dist/vue.global.prod.js', array(), '3.0.0', true);
    wp_enqueue_script('loan-calculator', plugin_dir_url(__FILE__) . 'js/app.js', array('vue-js'), '1.0', true);
    wp_enqueue_style('loan-calculator-styles', plugin_dir_url(__FILE__) . 'js/styles.css', array(), '1.0');
}
add_action('wp_enqueue_scripts', 'enqueue_loan_calculator_assets');

// Shortcode principal
function loan_calculator_shortcode($atts) {
    // Atributos por defecto
    $atts = shortcode_atts(array(
        'mostrar_detalles' => 'true', // 'true' o 'false'
        'tipo_simulacion' => 'monto-a-cuota' // 'monto-a-cuota' o 'cuota-a-monto'
    ), $atts);
    
    // Convertir string a boolean
    $mostrar_detalles = filter_var($atts['mostrar_detalles'], FILTER_VALIDATE_BOOLEAN);
    
    // Generar el HTML del simulador
    $html = '<div id="loan-calculator" data-mostrar-detalles="' . ($mostrar_detalles ? 'true' : 'false') . '">';
    $html .= '<div style="text-align: center; padding: 2rem;">';
    $html .= '<p>Cargando simulador...</p>';
    $html .= '</div>';
    $html .= '</div>';
    
    return $html;
}
add_shortcode('loan_calculator', 'loan_calculator_shortcode');

// Ejemplo de uso del shortcode:
// [loan_calculator mostrar_detalles="false"] - Oculta detalles y tabla de amortización
// [loan_calculator mostrar_detalles="true"] - Muestra detalles y tabla de amortización (por defecto)
// [loan_calculator] - Muestra todo (por defecto)
?>