import { PlusIcon } from '@/components/common/PlusIcon';
import useRefetch from '@/hooks/states/useRefetch';
import apiClient from '@/services/api-services/api-client';
import { formatPriceForInput, removeFormatting, toast } from '@/utils/MyUtils';
import {
  Avatar,
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
} from '@nextui-org/react';
import { useFormik } from 'formik';
import React, { ChangeEvent, useState } from 'react';
import * as yup from 'yup';

interface OptionGroupModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

const validationSchema = yup.object().shape({
  title: yup
    .string()
    .required('Vui lòng nhập tên nhóm lựa chọn')
    .max(30, 'Tên nhóm lựa chọn chỉ có tối đa 30 ký tự'),
});

export default function OptionGroupCreateModal({ isOpen, onOpenChange }: OptionGroupModalProps) {
  const { setIsRefetch } = useRefetch();
  const [urlFileList, setUrlFileList] = useState<string[]>([]);
  const initOption = {
    isDefault: false,
    title: '',
    isCalculatePrice: false,
    price: 0,
    imageUrl: '',
    status: 1,
  };
  const [options, setOptions] = useState([initOption]);

  const handleAddOption = () => {
    const newOption = setOptions([
      ...options,
      {
        isDefault: false,
        title: '',
        isCalculatePrice: false,
        price: 0,
        imageUrl: '',
        status: 1,
      },
    ]);
    formik.setFieldValue('options', [...options, newOption]);
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      type: '1',
      isRequire: '1',
      maxChoices: '',
      options: [initOption],
    },
    validationSchema,
    onSubmit: (values) => {
      handleCreate(values);
    },
  });

  const uploadImage = async (image: File | null) => {
    try {
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const responseData = await apiClient.put('storage/file/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (!responseData.data.isSuccess) {
          toast('error', responseData.data.error.message);
        } else {
          return responseData.data.value.url;
        }
      }
    } catch (error: any) {
      toast('error', error.response.data.error.message);
    }
  };
  const handleCreate = async (values: any) => {
    try {
      const isRequire = Number(values?.isRequire) === 1 ? false : true;
      const type = Number(values?.type);
      const maxChoices = Number(formik.values.maxChoices);
      let payload;

      if (isRequire) {
        const updatedOptions = [...options];
        if (type === 1) {
          updatedOptions[0].isDefault = true;
        } else if (type === 2) {
          for (let i = 0; i < maxChoices; i++) {
            updatedOptions[i].isDefault = true;
          }
        }
        updatedOptions.forEach((option, index) => {
          option.isCalculatePrice = option.price > 0 ? true : false;
          option.imageUrl = urlFileList[index];
        });
        setOptions(updatedOptions);
      } else {
        const updatedOptions = [...options];
        for (let i = 0; i < updatedOptions.length; i++) {
          updatedOptions[i].isDefault = false;
        }
        updatedOptions.forEach((option, index) => {
          option.isCalculatePrice = option.price > 0 ? true : false;
          option.imageUrl = urlFileList[index];
        });
        setOptions(updatedOptions);
      }

      if (type === 1 && isRequire) {
        payload = {
          title: values.title,
          isRequire: isRequire,
          type: type,
          minChoices: 1,
          maxChoices: 1,
          status: 1,
          options: options,
        };
      } else if (type === 1 && !isRequire) {
        payload = {
          title: values.title,
          isRequire: isRequire,
          type: type,
          minChoices: 0,
          maxChoices: 1,
          status: 1,
          options: options,
        };
      } else if (type === 2 && isRequire) {
        payload = {
          title: values.title,
          isRequire: isRequire,
          type: type,
          minChoices: 1,
          maxChoices: Number(values.maxChoices),
          status: 1,
          options: options,
        };
      } else if (type === 2 && !isRequire) {
        payload = {
          title: values.title,
          isRequire: isRequire,
          type: type,
          minChoices: 0,
          maxChoices: Number(values.maxChoices),
          status: 1,
          options: options,
        };
      }
      const responseData = await apiClient.post('shop-owner/option-group/create', payload);
      if (!responseData.data.isSuccess) {
        toast('error', responseData.data.error.message);
      } else {
        setIsRefetch();
        toast('success', 'Tạo nhóm lựa chọn thành công');
        onOpenChange(false);
        formik.resetForm();
        setOptions([initOption]);
        setUrlFileList([]);
      }
    } catch (error: any) {
      toast('error', 'Vui lòng kiểm tra lại thông tin!');
    }
  };

  const handleCancel = (onClose: () => void) => {
    onClose();
    formik.resetForm();
    setUrlFileList([]);
    setOptions([initOption]);
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files![0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setUrlFileList((prevList) => [...prevList, url]);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton
      isDismissable={false}
      className="max-h-[640px] rounded-xl overflow-y-auto"
    >
      <ModalContent className="pt-4">
        {(onClose) => (
          <React.Fragment>
            <ModalHeader className="flex flex-col text-2xl text-center">
              Tạo nhóm lựa chọn mới
            </ModalHeader>
            <ModalBody className="overflow-y-auto">
              <form className="space-y-4">
                <Input
                  isRequired
                  type="text"
                  name="title"
                  label="Tên nhóm lựa chọn"
                  placeholder="Nhập tên nhóm lựa chọn"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.title && !!formik.errors.title}
                  errorMessage={formik.touched.title && formik.errors.title}
                />
                <RadioGroup
                  name="isRequire"
                  label="Lựa chọn bắt buộc?"
                  className="text-sm"
                  size="sm"
                  defaultValue="1"
                  isRequired
                  value={formik.values.isRequire}
                  onChange={formik.handleChange}
                >
                  <div className="flex-row flex gap-4">
                    <Radio value="1">Không</Radio>
                    <Radio value="2">Có</Radio>
                  </div>
                </RadioGroup>
                <RadioGroup
                  name="type"
                  label="Hình thức lựa chọn"
                  className="text-sm"
                  size="sm"
                  defaultValue="1"
                  isRequired
                  value={formik.values.type}
                  onChange={formik.handleChange}
                >
                  <div className="flex-row flex gap-4">
                    <Radio value="1">Chọn một</Radio>
                    <Radio value="2">Chọn nhiều</Radio>
                  </div>
                </RadioGroup>
                {formik.values.type === '2' && (
                  <Input
                    isRequired
                    type="text"
                    name="maxChoices"
                    label="Số lựa chọn tối đa"
                    placeholder="Nhập số lựa chọn tối đa có thể chọn"
                    value={formik.values.maxChoices}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.maxChoices && !!formik.errors.maxChoices}
                    errorMessage={formik.touched.maxChoices && formik.errors.maxChoices}
                  />
                )}
                <Divider />
                <div className="flex justify-between items-center">
                  <p className="text-medium font-bold">Danh sách lựa chọn</p>
                  <Button
                    onClick={handleAddOption}
                    size="sm"
                    endContent={<PlusIcon size={16} />}
                    className="ml-auto"
                  >
                    Thêm
                  </Button>
                </div>
                {options.map((option, index) => (
                  <div key={index} className="flex justify-between gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        handleAvatarChange(event);
                      }}
                      id={`file-input-${index}`}
                      className="hidden"
                    />
                    <label htmlFor={`file-input-${index}`} className="cursor-pointer">
                      <Avatar
                        src={
                          urlFileList[index] ||
                          'https://www.949vans.com/images/products/detail/E60195ABKS.2.jpg'
                        }
                        alt="Avatar"
                        className="rounded-full w-12 h-12 border-small"
                      />
                    </label>
                    <Input
                      isRequired
                      type="text"
                      name={`options[${index}].title`}
                      label={`Tên lựa chọn`}
                      placeholder="Nhập tên lựa chọn"
                      value={option.title}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index].title = e.target.value;
                        setOptions(newOptions);
                        formik.setFieldValue(`options[${index}].title`, e.target.value);
                      }}
                    />
                    <Input
                      type="text"
                      name={`options[${index}].price`}
                      label={`Giá bán`}
                      placeholder="Nhập giá"
                      value={option.price ? formatPriceForInput(option.price.toString()) : '0'}
                      onChange={(e) => {
                        const newOptions = [...options];
                        const value = removeFormatting(e.target.value);
                        newOptions[index].price = value;
                        setOptions(newOptions);
                        formik.setFieldValue(`options[${index}].price`, value);
                      }}
                      className="w-2/3"
                      endContent={'VND'}
                    />
                  </div>
                ))}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="faded"
                onClick={() => handleCancel(onClose)}
                className="hover:text-danger-500 hover:border-danger-500"
              >
                Đóng
              </Button>
              <Button type="button" color="primary" onClick={() => formik.handleSubmit()}>
                Tạo
              </Button>
            </ModalFooter>
          </React.Fragment>
        )}
      </ModalContent>
    </Modal>
  );
}
