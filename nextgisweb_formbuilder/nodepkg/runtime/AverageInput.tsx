import { clamp, mean } from "lodash-es";
import { useState } from "react";

import {
  Button,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
} from "@nextgisweb/gui/antd";
import { gettext, gettextf } from "@nextgisweb/pyramid/i18n";

import { MAXIMUM_NUMBER_OF_SAMPLES } from "../constant";

import type { FormRuntimeField } from "./type";

interface AverageInputProps {
  id: string;
  value?: unknown;
  samples: number;
  datatype?: FormRuntimeField["datatype"];
  disabled?: boolean;
  onChange?: (value: number | string) => void;
}

export function AverageInput({
  id,
  value,
  samples,
  datatype,
  disabled,
  onChange,
}: AverageInputProps) {
  const [open, setOpen] = useState(false);
  const [measurements, setMeasurements] = useState<Array<number | null>>([]);
  const sampleCount = clamp(samples, 2, MAXIMUM_NUMBER_OF_SAMPLES);
  const complete =
    measurements.length === sampleCount &&
    measurements.every(
      (measurement): measurement is number =>
        measurement !== null && Number.isFinite(measurement)
    );

  const start = () => {
    setMeasurements(Array.from({ length: sampleCount }, () => null));
    setOpen(true);
  };

  const calculate = () => {
    if (!complete) return;
    const average = mean(measurements);
    const result =
      datatype === "INTEGER" || datatype === "BIGINT"
        ? Math.round(average)
        : average;
    onChange?.(
      datatype === "BIGINT" || datatype === "STRING" ? String(result) : result
    );
    setOpen(false);
  };

  return (
    <>
      <Flex gap={8}>
        <Button type="primary" disabled={disabled} onClick={start}>
          {gettext("Average")}
        </Button>
        <Input
          readOnly
          disabled={disabled}
          value={typeof value === "number" ? String(value) : ""}
          style={{ width: "100%" }}
        />
      </Flex>
      <Modal
        title={gettext("Average calculator")}
        open={open}
        okText={gettext("Count")}
        okButtonProps={{ disabled: !complete }}
        onOk={calculate}
        onCancel={() => setOpen(false)}
      >
        <Form>
          {measurements.map((measurement, index) => {
            const label = gettextf("Value {}")(index + 1);
            const inputId = `${id}-${index}`;
            return (
              <Form.Item key={index} label={label}>
                <InputNumber<number>
                  id={inputId}
                  aria-label={label}
                  value={measurement}
                  style={{ width: "100%" }}
                  onChange={(nextValue) =>
                    setMeasurements((current) =>
                      current.map((currentValue, currentIndex) =>
                        currentIndex === index ? nextValue : currentValue
                      )
                    )
                  }
                />
              </Form.Item>
            );
          })}
        </Form>
      </Modal>
    </>
  );
}
