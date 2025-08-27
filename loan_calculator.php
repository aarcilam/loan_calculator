<?php
/**
 * Plugin Name: Simulador de Crédito
 * Description: Shortcode para mostrar un simulador de crédito con opciones configurables
 * Version: 1.2.2
 * Author: Andres Arcila
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue de scripts y estilos
function enqueue_loan_calculator_assets() {
    // Sistema de versionado avanzado para evitar caché
    $plugin_file = __FILE__;
    $js_file = plugin_dir_path(__FILE__) . 'js/app.js';
    $css_file = plugin_dir_path(__FILE__) . 'js/styles.css';
    
    // Generar versiones únicas para cada archivo
    $js_version = file_exists($js_file) ? filemtime($js_file) : time();
    $css_version = file_exists($css_file) ? filemtime($css_file) : time();
    
    // Para desarrollo, usar hash de contenido para detectar cambios
    if (defined('WP_DEBUG') && WP_DEBUG) {
        $js_hash = file_exists($js_file) ? substr(md5_file($js_file), 0, 8) : 'dev';
        $css_hash = file_exists($css_file) ? substr(md5_file($css_file), 0, 8) : 'dev';
        
        $js_version = $js_version . '-' . $js_hash;
        $css_version = $css_version . '-' . $css_hash;
    }
    
    // Enqueue Vue.js desde CDN
    wp_enqueue_script('vue-js', 'https://unpkg.com/vue@3/dist/vue.global.prod.js', array(), '3.0.0', true);
    
    // Enqueue nuestros archivos con versiones únicas
    wp_enqueue_script('loan-calculator', plugin_dir_url(__FILE__) . 'js/app.js', array('vue-js'), $js_version, true);
    wp_enqueue_style('loan-calculator-styles', plugin_dir_url(__FILE__) . 'js/styles.css', array(), $css_version);
    
    // Log para desarrollo
    if (defined('WP_DEBUG') && WP_DEBUG) {
        wp_add_inline_script('loan-calculator', 
            'console.log("Loan Calculator loaded - JS: v' . $js_version . ', CSS: v' . $css_version . '");', 
            'before'
        );
    }
    
    // Agregar headers para evitar caché en desarrollo
    if (defined('WP_DEBUG') && WP_DEBUG) {
        add_action('wp_head', function() {
            echo '<!-- Loan Calculator Cache Buster: ' . time() . ' -->' . "\n";
        });
    }
}
add_action('wp_enqueue_scripts', 'enqueue_loan_calculator_assets');

// Función para limpiar caché del simulador
function loan_calculator_clear_cache() {
    // Esta función puede ser llamada manualmente para forzar la actualización
    $cache_key = 'loan_calculator_version';
    delete_transient($cache_key);
    
    // Log para desarrollo
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('Loan Calculator cache cleared at ' . current_time('mysql'));
    }
}

// Hook para limpiar caché cuando se actualiza el plugin
register_activation_hook(__FILE__, 'loan_calculator_clear_cache');

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

// Shortcode para mostrar información de versión (solo para desarrollo)
function loan_calculator_version_shortcode() {
    if (!defined('WP_DEBUG') || !WP_DEBUG) {
        return ''; // Solo mostrar en modo debug
    }
    
    $js_file = plugin_dir_path(__FILE__) . 'js/app.js';
    $css_file = plugin_dir_path(__FILE__) . 'js/styles.css';
    
    $js_version = file_exists($js_file) ? filemtime($js_file) : 'N/A';
    $css_version = file_exists($css_file) ? filemtime($css_file) : 'N/A';
    
    return sprintf(
        '<div style="background:#f0f0f0; padding:10px; margin:10px 0; border-left:4px solid #0073aa; font-family:monospace; font-size:12px;">
            <strong>Loan Calculator Debug Info:</strong><br>
            JS Version: %s<br>
            CSS Version: %s<br>
            Plugin File: %s<br>
            Current Time: %s
        </div>',
        $js_version,
        $css_version,
        filemtime(__FILE__),
        current_time('Y-m-d H:i:s')
    );
}
add_shortcode('loan_calculator_version', 'loan_calculator_version_shortcode');

// Ejemplo de uso del shortcode:
// [loan_calculator mostrar_detalles="false"] - Oculta detalles y tabla de amortización
// [loan_calculator mostrar_detalles="true"] - Muestra detalles y tabla de amortización (por defecto)
// [loan_calculator] - Muestra todo (por defecto)
// [loan_calculator_version] - Muestra información de versión (solo en modo debug)
?>