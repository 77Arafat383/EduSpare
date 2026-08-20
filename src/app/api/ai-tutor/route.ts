import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, action, taskTitle, category, notes } = body;

    let responseText = '';

    if (action === 'explain') {
      responseText = `### 💡 Contextual AI Breakdown for "${taskTitle}"

**Core Overview**:
This topic focuses on **${category}**. Here is a clear, step-by-step conceptual summary tailored to your current study task:

1. **Fundamental Principle**: 
   The main objective when working with ${taskTitle} is maintaining robust architecture, performance efficiency, and clean code separation.

2. **Key Formulas & Patterns**:
   - Connection lifecycle & state management.
   - Exception boundaries and error resilience.
   - Resource cleanup on disconnect/teardown.

3. **Practical Implementation Tip**:
   Always structure your implementation with modular interfaces and clear input validation before processing incoming socket frames or data streams.`;
    } else if (action === 'quiz') {
      responseText = `### 🧪 Flashcards & Practice Quiz: ${taskTitle}

**Question 1**: What is the primary purpose of using connection heartbeat cycles in real-time server sockets?
*Answer*: To detect dropped network connections early and free up server socket memory before idle timeout expires.

**Question 2**: How do you prevent race conditions when updating shared task data concurrently?
*Answer*: Utilize atomic database transactions or lock mechanisms (such as Redis distributed locks).

**Question 3**: What is the main trade-off of B-Tree index lookups versus sequential table scans?
*Answer*: B-Tree indexes provide logarithmic $O(\\log N)$ lookup speed for exact and range queries, but add disk write overhead on inserts and updates.`;
    } else if (action === 'summarize') {
      responseText = `### 📝 Key Concept Executive Summary

- **Subject**: ${category}
- **Target Task**: ${taskTitle}
- **Primary Takeaway**: Master the underlying mathematical & architectural mechanics, eliminate memory leaks, and test edge cases.
- **Recommended Next Steps**: Review attached study PDFs, benchmark latency under load, and verify error boundary handlers.`;
    } else {
      // General custom prompt handling
      responseText = `### 🤖 EduSpare AI Tutor

Great question regarding **"${taskTitle}"**!

Here is the breakdown for: *"${prompt}"*

- **Explanation**: In ${category}, addressing "${prompt}" requires understanding the data flow, component boundaries, and performance trade-offs.
- **Best Practice**: Keep your implementation modular and test asynchronous state handling carefully.
- **Pro-Tip**: You can save these notes directly to your task materials checklist on the left!`;
    }

    return NextResponse.json({ result: responseText });
  } catch (error) {
    return NextResponse.json({ error: 'AI Tutor service error' }, { status: 500 });
  }
}
