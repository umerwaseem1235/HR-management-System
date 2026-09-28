'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { ImagePlus, Trash2, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { User } from '@/lib/types';
import {
  EMPLOYEE_PHOTO_ACCEPT,
  EMPLOYEE_PHOTO_MAX_LABEL,
  validateEmployeePhotoFile,
  validateEmployeePhotoPayload,
} from '@/lib/employee-photo';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (values: { name: string; email: string }, photo: string | null) => Promise<void>;
  isSubmitting?: boolean;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
  isSubmitting,
}: EditProfileModalProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [formError, setFormError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setPhotoPreview(user.avatar || null);
      setPhotoError('');
      setFormError('');
    }
  }, [isOpen, user]);

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 256;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not read the selected image.'));
      };
      img.src = objectUrl;
    });

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validationError = validateEmployeePhotoFile(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }

    setPhotoError('');
    try {
      const preview = await compressImage(file);
      const payloadError = validateEmployeePhotoPayload(preview);
      if (payloadError) {
        setPhotoError(payloadError);
        return;
      }
      setPhotoPreview(preview);
    } catch {
      setPhotoError('Could not read the selected image.');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const formData = new FormData(event.currentTarget);
    const values = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    };

    try {
      await onSave(values, photoPreview);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update profile.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('action.editProfile')} size="md">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {formError && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[13px] font-medium text-red-700 dark:text-red-400">
            {formError}
          </div>
        )}
        <div>
          <span className="block text-sm font-medium text-dark-text dark:text-gray-100 mb-1.5">Profile Photo</span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-dashed border-medium-gray dark:border-gray-600 bg-blue-gray-light dark:bg-[#1b263b]/5 p-4">
            <label
              htmlFor="edit-profile-photo-upload"
              className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-gray dark:bg-[#1b263b]/10 border border-medium-gray dark:border-white/10 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-medium-gray dark:hover:bg-white/20'} transition-colors relative group`}
            >
              {photoPreview ? (
                <>
                  <NextImage
                    src={photoPreview}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    unoptimized
                    loader={({ src }) => src}
                    className="h-full w-full object-cover group-hover:opacity-40 transition-opacity"
                  />
                  {!isSubmitting && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImagePlus size={24} className="text-teal" />
                    </div>
                  )}
                </>
              ) : (
                <ImagePlus size={24} className={`text-teal ${!isSubmitting && 'group-hover:scale-110'} transition-transform`} />
              )}
            </label>
            <div className="flex-1">
              <p className="text-sm font-medium text-dark-text dark:text-gray-100">Upload a profile photo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use a clear JPG, PNG or WEBP image up to {EMPLOYEE_PHOTO_MAX_LABEL}.</p>
              {photoError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{photoError}</p>}
              <div className="flex items-center gap-3 mt-3">
                <label className={`inline-flex items-center gap-1.5 rounded-lg border border-medium-gray dark:border-white/10 bg-white dark:bg-[#1b263b] px-3 py-1.5 text-sm font-medium text-dark-text dark:text-gray-100 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-gray dark:hover:bg-white/10'}`}>
                  <ImagePlus size={15} />
                  {photoPreview ? t('action.replacePhoto') : t('action.choosePhoto')}
                  <input id="edit-profile-photo-upload" type="file" accept={EMPLOYEE_PHOTO_ACCEPT} onChange={handlePhotoChange} className="sr-only" disabled={isSubmitting} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Input 
            name="name" 
            label={t('profile.fullName')} 
            placeholder="Enter full name" 
            defaultValue={user.name} 
            required 
            disabled={isSubmitting} 
          />
          <Input 
            name="email" 
            label={t('profile.email')} 
            type="email" 
            placeholder="name@company.com" 
            defaultValue={user.email} 
            required 
            disabled={isSubmitting} 
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-medium-gray dark:border-white/10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>{t('action.cancel')}</Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            <Save size={16} /> {t('action.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
