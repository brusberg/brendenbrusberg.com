#version 300 es

// Vertex attributes
layout(location = 0) in vec2 a_position;    // Vertex position (quad corner)
layout(location = 1) in vec2 a_texCoord;    // Texture coordinates
layout(location = 2) in vec4 a_color;       // Vertex color/tint

// Uniforms
uniform mat4 u_projection;  // Orthographic projection matrix

// Outputs to fragment shader
out vec2 v_texCoord;
out vec4 v_color;

void main() {
    v_texCoord = a_texCoord;
    v_color = a_color;
    gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
}



