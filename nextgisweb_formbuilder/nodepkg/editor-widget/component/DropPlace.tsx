import classNames from "classnames";

export const DropPlace = ({
    onDrop,
    active,
}: {
    onDrop: (e: MouseEvent) => void;
    active: boolean;
}) => {
    return (
        <div
            className={classNames("drop-place", { active })}
            onMouseUp={(e: any) => {
                onDrop(e);
            }}
        />
    );
};
