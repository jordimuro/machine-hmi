import { readFileSync } from 'fs';

// Script para verificar qué tags del array aAxisDiagnostic existen realmente en el servidor OPC-UA

const tagsConfig = JSON.parse(readFileSync('tags.json', 'utf8'));

console.log('=== VERIFICACIÓN DE TAGS OPC-UA ===\n');

// Contar tags por tipo
const tagsByType = {
  basic: 0,
  motor: 0
};

const motorTags = [];
const basicTags = [];

Object.entries(tagsConfig.tags).forEach(([tagName, config]) => {
  if (tagName.includes('aAxisDiagnostic')) {
    tagsByType.motor++;
    motorTags.push({ name: tagName, nodeId: config.nodeId });
  } else {
    tagsByType.basic++;
    basicTags.push({ name: tagName, nodeId: config.nodeId });
  }
});

console.log(`Tags básicos: ${tagsByType.basic}`);
console.log(`Tags de motores: ${tagsByType.motor}`);
console.log(`Total tags: ${tagsByType.basic + tagsByType.motor}\n`);

console.log('=== TAGS BÁSICOS (deberían existir) ===');
basicTags.forEach(tag => {
  console.log(`${tag.name}: ${tag.nodeId}`);
});

console.log('\n=== PRIMEROS 10 TAGS DE MOTORES ===');
motorTags.slice(0, 10).forEach(tag => {
  console.log(`${tag.name}: ${tag.nodeId}`);
});

console.log('\n=== RECOMENDACIONES ===');
console.log('1. Los tags básicos (ActualSpeed, RandomValue_*) deberían funcionar');
console.log('2. Los tags de motores (aAxisDiagnostic_*) pueden no existir en el servidor real');
console.log('3. Si los tags de motores no existen, la vista OPC Performance mostrará valores 0');
console.log('4. Para probar con datos reales, asegúrate de que el array aAxisDiagnostic existe en el PLC');

console.log('\n=== NODEIDS DE EJEMPLO PARA VERIFICAR ===');
console.log('Motor 1, Variable 1:', motorTags[0]?.nodeId);
console.log('Motor 1, Variable 2:', motorTags[1]?.nodeId);
console.log('Motor 2, Variable 1:', motorTags[23]?.nodeId);