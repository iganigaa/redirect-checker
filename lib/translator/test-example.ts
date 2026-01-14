/**
 * Примеры текстов для тестирования переводчика
 */

export const SHORT_TEXT = `
Hello! This is a test translation.
The weather is nice today.
How are you doing?
`;

export const MEDIUM_TEXT = `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on developing systems that can learn and improve from experience without being explicitly programmed. It has become one of the most important technologies in modern computing.

## Key Concepts

1. **Supervised Learning**: The algorithm learns from labeled training data
2. **Unsupervised Learning**: The algorithm finds patterns in unlabeled data
3. **Reinforcement Learning**: The algorithm learns through trial and error

Machine learning applications are everywhere - from recommendation systems to autonomous vehicles.
`;

export const LONG_TEXT = `
# The Future of Artificial Intelligence

Artificial Intelligence (AI) has rapidly evolved from a theoretical concept to a practical technology that influences nearly every aspect of our daily lives. From virtual assistants to recommendation algorithms, AI systems are becoming increasingly sophisticated and integrated into our digital infrastructure.

## Historical Context

The journey of AI began in the 1950s when pioneers like Alan Turing and John McCarthy laid the theoretical foundations. The famous Turing Test proposed a criterion for machine intelligence that continues to influence AI research today.

## Current State of AI

Today's AI systems leverage several key technologies:

1. **Deep Learning**: Neural networks with multiple layers that can learn complex patterns
2. **Natural Language Processing**: Enabling machines to understand and generate human language
3. **Computer Vision**: Allowing computers to interpret and understand visual information
4. **Reinforcement Learning**: Training agents to make decisions in complex environments

## Practical Applications

AI is transforming industries:

- **Healthcare**: Diagnostic systems, drug discovery, personalized medicine
- **Finance**: Fraud detection, algorithmic trading, risk assessment
- **Transportation**: Autonomous vehicles, traffic optimization, logistics
- **Education**: Personalized learning, automated grading, intelligent tutoring systems

## Ethical Considerations

As AI becomes more powerful, we must address important ethical questions:

- Privacy and data protection
- Algorithmic bias and fairness
- Job displacement and economic impact
- Autonomous decision-making in critical situations

## The Road Ahead

The future of AI holds immense promise. Researchers are working on:

1. More efficient and sustainable AI models
2. Explainable AI that can justify its decisions
3. General AI that can perform diverse tasks
4. AI systems that align with human values

As we move forward, collaboration between technologists, policymakers, and society at large will be crucial to ensure that AI development benefits humanity as a whole.
`;

// Генерация очень длинного текста для стресс-теста
export function generateVeryLongText(paragraphs: number = 100): string {
  const paragraph = `
This is a test paragraph for translation. It contains several sentences that need to be translated accurately. The purpose is to test the chunking algorithm and parallel processing capabilities of the translation system. We want to ensure that the system can handle large volumes of text efficiently.
  `.trim();

  return Array(paragraphs)
    .fill(paragraph)
    .map((p, i) => `${i + 1}. ${p}`)
    .join('\n\n');
}
