export const DropPlace = ({
    onDrop,
    elId,
    active,
}: {
    onDrop: (e: MouseEvent) => void;
    elId: number;
    active: boolean;
}) => {
    return (
        <div
            data-elid={elId}
            className={
                active ? "drop_place_fbwidget" : "drop_place_inactive_fbwidget"
            }
            onMouseUp={(e: any) => {
                onDrop(e);
            }}
        ></div>
    );
};
