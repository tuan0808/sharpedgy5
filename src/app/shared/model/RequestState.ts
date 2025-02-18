export interface RequestState<T> {
    loading: boolean;
    data: T | null;
    error: string | null;
}
