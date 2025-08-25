<?php
/**
 * Plugin Name: Loan Calculator
 * Description: Pequeña calculadora de préstamos con Vue.js inyectada por shortcode.
 * Version: 1.0
 * Author: Tu Nombre
 */

if (!defined('ABSPATH')) {
    exit;
}

// Registrar scripts
function lc_enqueue_scripts() {
    // Vue desde CDN
    wp_enqueue_script(
        'vuejs',
        'https://unpkg.com/vue@3/dist/vue.global.js',
        [],
        null,
        true
    );

    // Nuestro script
    wp_enqueue_script(
        'loan-calculator-app',
        plugin_dir_url(__FILE__) . 'js/app.js',
        ['vuejs'],
        '1.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'lc_enqueue_scripts');

// Shortcode
function lc_shortcode() {
    return '<div id="loan-calculator"></div>';
}
add_shortcode('loan_calculator', 'lc_shortcode');