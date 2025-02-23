export interface Achievement {
    id: number;
    title: string;
    description: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    progress: number;
    iconType: string;
    completed: boolean;
    completedDate: string | null;
}
