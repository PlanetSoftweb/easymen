import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Camera } from 'lucide-react';
import SuccessModal from './SuccessModal';
import imageCompression from 'browser-image-compression';

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Meals',
  'Equipment',
  'Software',
  'Utilities',
  'Site Work',
  'Bill',
  'Miscellaneous'
];

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/jpeg'
    };
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      toast.error('Error compressing image. Please try a different image.');
      console.error('Error compressing image:', error);
      return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const compressedFile = await compressImage(file);
      if (compressedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPhoto(compressedFile);
          setPhotoPreview(base64String);
        };
        reader.readAsDataURL(compressedFile);
      } else {
        setPhoto(null);
        setPhotoPreview('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('You must be logged in to submit an expense');
      return;
    }

    if (!formData.category || !formData.description || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);

    try {
        // Allow negative amounts for expenses when balance is zero
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        const photoBase64 = photoPreview || null;
        const newBalance = currentUser.company_balance - amount;

        // First update user's balance
        const { error: balanceError } = await supabase
          .from('users')
          .update({ 
            company_balance: newBalance
          })
          .eq('id', currentUser.id);

        if (balanceError) {
          toast.error('Error updating balance');
          return;
        }

        // Then insert the expense
        const { error: expenseError } = await supabase
          .from('expenses')
          .insert({
            user_id: currentUser.id,
            category: formData.category,
            description: formData.description,
            amount: amount,
            image: photoBase64,
            date: new Date().toISOString().split('T')[0],
            user_name: currentUser.name,
            created_at: new Date().toISOString()
          });

        if (expenseError) {
          console.error('Expense submission error:', expenseError);
          toast.error('Failed to submit expense. Please try again.');
          return;
        }

        // Clear form after successful submission
        setFormData({
          category: '',
          description: '',
          amount: '',
        });
        setPhoto(null);
        setPhotoPreview('');
        
        // Play success sound
        const audio = new Audio('/expense-success.mp3');
        audio.play();
        
        // Vibrate device
        if ('vibrate' in navigator) {
          navigator.vibrate(1000); // Vibrate for 1 second
        }
        
        // Show success modal
        setIsSuccessModalOpen(true);
        setTimeout(() => {
          setIsSuccessModalOpen(false);
          onSuccess?.();
        }, 2000);

    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to submit expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600">Welcome, <span className="font-medium text-gray-900">{currentUser?.name}</span></p>
        <p className="text-sm text-gray-600">Your current company balance: <span className="font-medium text-green-600">₹{currentUser?.company_balance?.toFixed(2) || '0.00'}</span></p>
      </div>
      <h2 className="text-lg font-medium text-gray-900 mb-6">Submit New Expense</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="mt-2 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-4 py-3"
          >
            <option value="">Select a category</option>
            {EXPENSE_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            value={formData.description}
            onChange={handleChange}
            className="mt-2 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-4 py-3"
            placeholder="Provide details about the expense"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              name="amount"
              id="amount"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={handleChange}
              className="mt-2 block w-full pl-7 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-4 py-3"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
            Receipt Photo (Optional)
          </label>
          <div className="mt-1 flex items-center">
            <div className="flex gap-2">
              <label
                htmlFor="photo-upload"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="flex items-center">
                  <Upload size={16} className="mr-2" />
                  Choose File
                </span>
                <input
                  id="photo-upload"
                  name="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <label
                htmlFor="camera-upload"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="flex items-center">
                  <Camera size={16} className="mr-2" />
                  Take Photo
                </span>
                <input
                  id="camera-upload"
                  name="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
            {photo && (
              <div className="ml-3">
                <span className="text-sm text-gray-600">
                  {photo.name}
                </span>
                {photoPreview && (
                  <div className="mt-2">
                    <img 
                      src={photoPreview} 
                      alt="Receipt preview" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-5">
          <button
            type="button"
            onClick={onSuccess}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
          >
            {submitting ? 'Submitting...' : 'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
    <SuccessModal 
      isOpen={isSuccessModalOpen}
      onClose={() => setIsSuccessModalOpen(false)}
    />
    </>
  );
}