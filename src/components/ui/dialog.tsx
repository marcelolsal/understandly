// shadcn/ui Dialog composition: Radix supplies focus trapping and keyboard behavior.
import * as React from 'react';
import * as Primitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
export const Dialog = Primitive.Root;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;
export function DialogContent({ children, className, ...props }: React.ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Overlay className="dialog-overlay" />
    <Primitive.Content className={cn('dialog-content', className)} {...props}>
      {children}<Primitive.Close className="dialog-close" aria-label="Cerrar"><X size={19} /></Primitive.Close>
    </Primitive.Content></Primitive.Portal>;
}
