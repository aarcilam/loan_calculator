<?php
/**
 * Plugin Name: Simulador de Crédito 
 * Description: Simulador avanzado que usa las fórmulas exactas de Excel para monto a cuota y cuota a monto. Hecho con vue 3 desde cdn.
 * Version: 1.0
 * Author: Andres Arcila
 */

if (!defined('ABSPATH')) {
    exit;
}

// Registrar scripts
function lc_enqueue_scripts() {
    // Vue desde CDN (versión de producción)
    wp_enqueue_script(
        'vuejs',
        'https://unpkg.com/vue@3/dist/vue.global.prod.js',
        [],
        '3.0.0',
        false // Cargar en el head para asegurar que esté disponible
    );

    // Nuestro script
    wp_enqueue_script(
        'loan-calculator-app',
        plugin_dir_url(__FILE__) . 'js/app.js',
        ['vuejs'],
        '1.0',
        true // Cargar en el footer
    );
}
add_action('wp_enqueue_scripts', 'lc_enqueue_scripts');

// Shortcode
function lc_shortcode() {
    // Generar nonce único para este shortcode
    $nonce = wp_create_nonce('loan_calculator_nonce');
    
    return sprintf(
        '<div id="loan-calculator" data-nonce="%s"></div>',
        esc_attr($nonce)
    );
}
add_shortcode('loan_calculator', 'lc_shortcode');

// Agregar meta tag para CSP
function lc_add_csp_meta() {
    echo '<meta http-equiv="Content-Security-Policy" content="script-src \'self\' \'unsafe-inline\' https://unpkg.com; style-src \'self\' \'unsafe-inline\';" />';
}
add_action('wp_head', 'lc_add_csp_meta');