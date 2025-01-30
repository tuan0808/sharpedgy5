// uid.utils.ts
export class UIDFormatter {
    /**
     * Formats a Firebase UID into a standardized format
     * @param uid The Firebase UID to format
     * @param format The format type ('short' | 'dashed' | 'compact')
     * @returns Formatted UID string
     */
    static format(uid: string, format: 'short' | 'dashed' | 'compact' = 'dashed'): string {
        if (!uid) return '';

        // Remove any existing formatting
        const cleanUid = uid.replace(/-/g, '');

        switch (format) {
            case 'short':
                // Returns first 8 characters
                return cleanUid.slice(0, 8);

            case 'dashed':
                // Format as: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                return [
                    cleanUid.slice(0, 8),
                    cleanUid.slice(8, 12),
                    cleanUid.slice(12, 16),
                    cleanUid.slice(16, 20),
                    cleanUid.slice(20)
                ].join('-');

            case 'compact':
                // Returns last 6 characters
                return `...${cleanUid.slice(-6)}`;

            default:
                return uid;
        }
    }
}
