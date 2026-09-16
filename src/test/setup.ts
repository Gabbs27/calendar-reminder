import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Vitest no expone afterEach como global, así que Testing Library no limpia sola y los
// renders de un test se quedarían en el documento del siguiente.
afterEach(cleanup);
