import classNames from "classnames";

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
            className={classNames("drop-place", { active })}
            onMouseUp={(e: any) => {
                onDrop(e);
            }}
        ></div>
    );
};
