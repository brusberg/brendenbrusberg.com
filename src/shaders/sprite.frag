#version 300 es

precision mediump float;

// Inputs from vertex shader
in vec2 v_texCoord;
in vec4 v_color;

// Texture sampler
uniform sampler2D u_texture;

// Whether to use texture (0 = solid color, 1 = textured)
uniform float u_useTexture;

// Output color
out vec4 fragColor;

void main() {
    if (u_useTexture > 0.5) {
        // Sample texture and multiply by tint color
        vec4 texColor = texture(u_texture, v_texCoord);
        fragColor = texColor * v_color;
    } else {
        // Solid color mode (for placeholders)
        fragColor = v_color;
    }
    
    // Discard fully transparent pixels
    if (fragColor.a < 0.01) {
        discard;
    }
}



