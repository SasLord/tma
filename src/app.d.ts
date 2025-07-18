// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// interface TelegramWebApp {
// 	initData: string;
// 	initDataUnsafe: Record<string, unknown>;
// 	version: string;
// 	platform: string;
// 	colorScheme: 'light' | 'dark';
// 	themeParams: {
// 		bg_color?: string;
// 		text_color?: string;
// 		hint_color?: string;
// 		link_color?: string;
// 		button_color?: string;
// 		button_text_color?: string;
// 		secondary_bg_color?: string;
// 		header_bg_color?: string;
// 		accent_text_color?: string;
// 		section_bg_color?: string;
// 		section_header_text_color?: string;
// 		subtitle_text_color?: string;
// 		destructive_text_color?: string;
// 	};
// 	isExpanded: boolean;
// 	viewportHeight: number;
// 	viewportStableHeight: number;
// 	headerColor: string;
// 	backgroundColor: string;
// 	isClosingConfirmationEnabled: boolean;
// 	isVerticalSwipesEnabled: boolean;
// 	// Add other methods and properties as needed
// 	ready(): void;
// 	expand(): void;
// 	close(): void;
// 	showAlert(message: string, callback?: () => void): void;
// 	showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
// 	showPopup(params: Record<string, unknown>, callback?: (buttonId: string) => void): void;
// 	// Add more methods as needed
// }

declare global {
	// interface Window {
	// 	Telegram: {
	// 		WebApp: TelegramWebApp;
	// 	};
	// }

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
