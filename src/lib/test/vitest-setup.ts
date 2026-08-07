import { beforeEach, vi } from 'vitest';

const store = new Map<string, string>();

const localStorageMock: Storage = {
	getItem: (key: string) => store.get(key) ?? null,
	setItem: (key: string, value: string) => {
		store.set(key, value);
	},
	removeItem: (key: string) => {
		store.delete(key);
	},
	clear: () => {
		store.clear();
	},
	key: (index: number) => Array.from(store.keys())[index] ?? null,
	get length() {
		return store.size;
	}
};

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
	store.clear();
});
