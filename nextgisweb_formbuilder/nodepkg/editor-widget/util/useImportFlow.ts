import { useCallback, useRef, useState } from "react";

import { Modal } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

/* prettier-ignore */ const
msgConfirmNewImport = gettext("All existing options will be deleted after import. Are you sure you want to proceed?"),
msgConfirmCancelImport = gettext("All progress will be lost. Are you sure you want to cancel import?");

export function useImportFlow(
  rowsCount: number,
  onSubmit: (rows: Record<string, string>[]) => void
) {
  const [modal, contextHolder] = Modal.useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  const importDone = useRef(false);
  const importStarted = useRef(false);

  const handleClick = useCallback(async () => {
    if (rowsCount && !importStarted.current) {
      const confirmed = await modal.confirm({ content: msgConfirmNewImport });
      if (!confirmed) return;
    }
    importDone.current = false;
    importStarted.current = true;
    setIsOpen(true);
  }, [modal, rowsCount]);

  const handleModalOnCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSubmit = useCallback(
    (rows: Record<string, string>[]) => {
      onSubmit(rows);
      importDone.current = true;
      importStarted.current = false;
      setResetCount((c) => c + 1);
    },
    [onSubmit]
  );

  const handleClose = useCallback(async () => {
    if (!importDone.current) {
      const confirmed = await modal.confirm({
        content: msgConfirmCancelImport,
      });
      if (!confirmed) return;
    }
    importStarted.current = false;
    setIsOpen(false);
    setResetCount((c) => c + 1);
  }, [modal]);

  return {
    contextHolder,
    isOpen,
    resetCount,
    handleClick,
    handleModalOnCancel,
    handleSubmit,
    handleClose,
  };
}
