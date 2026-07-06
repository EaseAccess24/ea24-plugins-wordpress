/**
 * TextField — a labeled multiline paste control.
 *
 * A <textarea> (not <input>) so a full <script> snippet pastes cleanly. The
 * label is programmatically associated, and helper text + error are linked via
 * `aria-describedby`; `aria-invalid` flips on error.
 */

/**
 * @param {Object}   props
 * @param {string}   props.id            Unique id; drives label/aria wiring.
 * @param {string}   props.label         Visible field label.
 * @param {string}   [props.helpText]    Helper copy below the field.
 * @param {string}   [props.error]       Error copy (also sets aria-invalid).
 * @param {string}   props.value         Controlled value.
 * @param {Function} props.onChange      Receives the new string value.
 * @param {string}   [props.placeholder] Placeholder text.
 * @param {number}   [props.rows]        Textarea rows.
 */
export default function TextField( {
	id,
	label,
	helpText,
	error,
	value,
	onChange,
	placeholder,
	rows = 3,
} ) {
	const helpId = `${ id }-help`;
	const errorId = `${ id }-error`;
	const describedBy =
		[ helpText && helpId, error && errorId ]
			.filter( Boolean )
			.join( ' ' ) || undefined;

	return (
		<div>
			<label
				htmlFor={ id }
				className="ea24-mb-2 ea24-block ea24-text-sm ea24-font-semibold ea24-text-ea24-body"
			>
				{ label }
			</label>
			<textarea
				id={ id }
				rows={ rows }
				value={ value }
				onChange={ ( event ) => onChange( event.target.value ) }
				placeholder={ placeholder }
				aria-describedby={ describedBy }
				aria-invalid={ error ? 'true' : undefined }
				className={ `ea24-block ea24-w-full ea24-resize-none ea24-rounded-input ea24-border-[1.5px] ea24-border-solid ea24-bg-[#fbfafe] ea24-px-4 ea24-py-3 ea24-font-mono ea24-text-sm ea24-leading-relaxed ea24-text-ea24-body focus:ea24-bg-white focus:ea24-border-ea24-brand focus:ea24-shadow-[0_0_0_3px_rgba(93,41,215,.14)] ${
					error
						? 'ea24-border-ea24-danger-text'
						: 'ea24-border-ea24-card-border'
				}` }
			/>
			{ helpText && (
				<p
					id={ helpId }
					className="ea24-mt-2 ea24-text-xs ea24-text-ea24-muted"
				>
					{ helpText }
				</p>
			) }
			{ error && (
				<p
					id={ errorId }
					className="ea24-mt-2 ea24-text-xs ea24-text-ea24-danger-text"
				>
					{ error }
				</p>
			) }
		</div>
	);
}
