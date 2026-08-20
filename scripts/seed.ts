import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding EduSpare database...');

  // Clean existing tables
  await prisma.userBlock.deleteMany();
  await prisma.message.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.community.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const alex = await prisma.user.create({
    data: {
      username: 'alex_dev',
      name: 'Alex Rivera',
      email: 'alex@eduspare.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'CS & Artificial Intelligence student. Passionate about real-time distributed systems and competitive programming.',
      university: 'MIT - Computer Science & Engineering',
      activeStreak: 42,
      totalPoints: 2450,
      rank: 'Top 3% Contributor',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      username: 'sarah_j',
      name: 'Sarah Jenkins',
      email: 'sarah@eduspare.io',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Systems Architect & Technical Educator. Building scalable cloud solutions.',
      university: 'Stanford University',
      activeStreak: 28,
      totalPoints: 1890,
      rank: 'Senior Mentor',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      username: 'marcus_v',
      name: 'Dr. Marcus Vance',
      email: 'marcus@eduspare.io',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Quantum Physics Researcher exploring qubit entanglement and quantum algorithms.',
      university: 'Oxford University',
      activeStreak: 15,
      totalPoints: 1420,
      rank: 'Research Fellow',
    },
  });

  const elena = await prisma.user.create({
    data: {
      username: 'elena_r',
      name: 'Elena Rostova',
      email: 'elena@eduspare.io',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Data Science Fellow studying Deep Learning and Computer Vision.',
      university: 'ETH Zurich',
      activeStreak: 31,
      totalPoints: 1670,
      rank: 'Top 5% Contributor',
    },
  });

  console.log('Created Users:', [alex.username, sarah.username, marcus.username, elena.username]);

  // Create Tasks for Alex
  const now = new Date();
  const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2Days = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const in5Days = new Date(now.getTime() + 120 * 60 * 60 * 1000);

  const task1 = await prisma.task.create({
    data: {
      userId: alex.id,
      title: 'Implement WebSockets in NestJS Architecture',
      description: 'Build robust WebSocket gateway with JWT authentication, heartbeat pong handlers, and rooms manager.',
      category: 'Backend Systems',
      dueAt: in4Hours,
      importance: 95,
      status: 'In Progress',
      notes: `### Implementation Requirements\n- Configure @WebSocketGateway with CORS allowed origins\n- Handle handleConnection and handleDisconnect hooks\n- Maintain Redis adapter for multi-node horizontal scaling\n- Implement reconnection fallback protocol`,
      materials: JSON.stringify([
        {
          id: 'mat-1',
          title: 'RFC 6455 WebSocket Protocol Spec',
          type: 'pdf',
          url: 'https://datatracker.ietf.org/doc/html/rfc6455',
          notes: 'Section 4: Handshake protocol details',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mat-2',
          title: 'NestJS WebSockets Official Documentation',
          type: 'link',
          url: 'https://docs.nestjs.com/websockets/gateways',
          notes: 'Gateway decorators and payload validation filters',
          createdAt: new Date().toISOString(),
        },
      ]),
    },
  });

  await prisma.task.create({
    data: {
      userId: alex.id,
      title: 'Quantum Computing & Qubit Entanglement Exam',
      description: 'Prepare notes on Bell states, Hadamard gates, and Grover search algorithm.',
      category: 'Physics',
      dueAt: in1Day,
      importance: 90,
      status: 'Pending',
      notes: `Key concepts to review:\n- Matrix representation of Pauli X, Y, Z gates\n- Quantum teleportation circuit design\n- Phase kickback mechanism`,
      materials: JSON.stringify([
        {
          id: 'mat-3',
          title: 'Quantum Mechanics & Qubits Textbook Chapter 4',
          type: 'pdf',
          url: 'https://example.com/quantum_ch4.pdf',
          notes: 'Page 120-145',
          createdAt: new Date().toISOString(),
        },
      ]),
    },
  });

  await prisma.task.create({
    data: {
      userId: alex.id,
      title: 'Neural Networks & Backpropagation Derivation',
      description: 'Derive vector calculus partial derivatives for multi-layer perceptron cross-entropy loss.',
      category: 'AI & Mathematics',
      dueAt: in2Days,
      importance: 88,
      status: 'Pending',
      notes: `Focus on matrix calculus chain rule step-by-step for layer l to l-1.`,
      materials: JSON.stringify([]),
    },
  });

  await prisma.task.create({
    data: {
      userId: alex.id,
      title: 'Database B-Tree Indexing Benchmarks',
      description: 'Run benchmark scripts comparing PostgreSQL B-Tree vs BRIN indexes on 10 million rows.',
      category: 'Database Systems',
      dueAt: in3Days,
      importance: 75,
      status: 'Pending',
      notes: `Analyze EXPLAIN ANALYZE execution plans for range queries vs exact lookups.`,
      materials: JSON.stringify([]),
    },
  });

  await prisma.task.create({
    data: {
      userId: alex.id,
      title: 'Refactor Platform Design Components to Tailwind',
      description: 'Migrate legacy CSS classes to utility-first glassmorphism style rules.',
      category: 'Frontend Engineering',
      dueAt: in5Days,
      importance: 60,
      status: 'Pending',
      notes: `Update typography hierarchy to Inter font weights.`,
      materials: JSON.stringify([]),
    },
  });

  // Create Blogs
  const blog1 = await prisma.blog.create({
    data: {
      authorId: sarah.id,
      title: 'Building High-Throughput Real-Time Systems with WebSockets & Redis Pub/Sub',
      content: `Real-time bidirectional communication is fundamental to modern collaborative SaaS platforms. In this deep dive, we explore how to scale WebSocket connection clusters across multiple server instances using Redis Pub/Sub backplanes.

### Key Architecture Design
1. **Connection Termination**: Edge load balancers handle TLS termination and forward WebSocket connections to stateless gateway pods.
2. **Pub/Sub Broker**: Redis handles message fan-out across socket instances.
3. **Heartbeat Monitoring**: Client ping/pong cycles detect dropped sockets within 10 seconds.

\`\`\`typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(\`Client connected: \${client.id}\`);
  }
}
\`\`\`
Check out the attached architectural blueprint PDF for detailed sequence diagrams!`,
      coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      attachments: JSON.stringify([
        {
          id: 'att-1',
          name: 'WebSocket_Scale_Architecture_Blueprint.pdf',
          type: 'pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          size: '2.4 MB',
        },
      ]),
      tags: JSON.stringify(['WebSockets', 'System Architecture', 'Redis', 'Node.js']),
    },
  });

  const blog2 = await prisma.blog.create({
    data: {
      authorId: alex.id,
      title: 'Understanding Multi-Head Attention Mechanisms in Transformer Networks',
      content: `Self-attention allows deep neural networks to dynamically weight input tokens regardless of their relative distance. Let's break down Query, Key, and Value matrix multiplications:

$$ Attention(Q, K, V) = softmax\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V $$

When scaling to Multi-Head Attention, we project queries, keys, and values $h$ times with separate learned projection matrices. This allows the model to jointly attend to information from different representation subspaces at different positions.`,
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      attachments: JSON.stringify([
        {
          id: 'att-2',
          name: 'Attention_Is_All_You_Need_Summary.pdf',
          type: 'pdf',
          url: 'https://arxiv.org/pdf/1706.03762.pdf',
          size: '1.8 MB',
        },
      ]),
      tags: JSON.stringify(['Machine Learning', 'Transformers', 'Deep Learning', 'PyTorch']),
    },
  });

  // Comments on Blog 1
  await prisma.comment.create({
    data: {
      blogId: blog1.id,
      authorId: alex.id,
      content: 'Fantastic article Sarah! How do you handle sticky sessions at the load balancer level when scaling NestJS pods in Kubernetes?',
    },
  });

  await prisma.comment.create({
    data: {
      blogId: blog1.id,
      authorId: elena.id,
      content: 'The architectural PDF diagram is super clear. Bookmarked this for our data pipeline real-time alert service!',
    },
  });

  // Reactions
  await prisma.reaction.create({
    data: {
      blogId: blog1.id,
      userId: alex.id,
      type: 'like',
    },
  });

  await prisma.reaction.create({
    data: {
      blogId: blog1.id,
      userId: elena.id,
      type: 'love',
    },
  });

  // Saved items for Alex
  await prisma.savedItem.create({
    data: {
      userId: alex.id,
      itemType: 'blog',
      itemId: blog1.id,
      title: blog1.title,
      url: `/blog?post=${blog1.id}`,
    },
  });

  await prisma.savedItem.create({
    data: {
      userId: alex.id,
      itemType: 'pdf',
      title: 'WebSocket Scale Architecture Blueprint.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
  });

  // Messages between Alex and Sarah
  await prisma.message.create({
    data: {
      senderId: sarah.id,
      receiverId: alex.id,
      content: 'Hey Alex! Did you get a chance to review the WebSocket gateway architecture spec for our project task?',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
    },
  });

  await prisma.message.create({
    data: {
      senderId: alex.id,
      receiverId: sarah.id,
      content: 'Yes Sarah! I just set up the Task workspace for it with the priority algorithm. Testing the NestJS socket handler now.',
      createdAt: new Date(now.getTime() - 1000 * 60 * 45),
    },
  });

  await prisma.message.create({
    data: {
      senderId: sarah.id,
      receiverId: alex.id,
      content: 'Awesome! Let me know if you run into any issues with the Redis pub/sub adapter config.',
      createdAt: new Date(now.getTime() - 1000 * 60 * 10),
    },
  });

  // Communities
  await prisma.community.create({
    data: {
      name: 'Computer Science & Systems Lab',
      description: 'Collaborative research group for backend engineering, operating systems, and distributed systems.',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      tags: JSON.stringify(['Systems', 'Distributed Systems', 'C++', 'Backend']),
      isPrivate: false,
      memberIds: JSON.stringify([alex.id, sarah.id]),
      createdById: sarah.id,
    },
  });

  await prisma.community.create({
    data: {
      name: 'AI & Machine Learning Hub',
      description: 'Discussing paper readings, Transformer architectures, computer vision, and LLM fine-tuning.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
      tags: JSON.stringify(['Machine Learning', 'AI', 'Python', 'PyTorch']),
      isPrivate: false,
      memberIds: JSON.stringify([alex.id, elena.id]),
      createdById: elena.id,
    },
  });

  await prisma.community.create({
    data: {
      name: 'Quantum Physics & Math Society',
      description: 'Exploring quantum entanglement, linear algebra, differential geometry, and theoretical physics.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
      tags: JSON.stringify(['Quantum', 'Physics', 'Mathematics']),
      isPrivate: true,
      memberIds: JSON.stringify([marcus.id, alex.id]),
      createdById: marcus.id,
    },
  });

  console.log('EduSpare database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
